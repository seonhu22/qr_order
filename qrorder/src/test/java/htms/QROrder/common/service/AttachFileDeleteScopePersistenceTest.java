package htms.QROrder.common.service;

import htms.QROrder.audit.service.AuditService;
import htms.QROrder.auth.LocalPostgresTestSupport;
import htms.QROrder.auth.domain.Login;
import htms.QROrder.client.controller.BoardController;
import htms.QROrder.client.controller.MenuManageController;
import htms.QROrder.client.dto.ClientQnaRequest;
import htms.QROrder.client.repository.ClientQnaMapper;
import htms.QROrder.client.repository.MenuDetailMapper;
import htms.QROrder.client.repository.MenuOptionDetailMapper;
import htms.QROrder.client.dto.MenuDetailRequest;
import htms.QROrder.client.service.ClientNoticeService;
import htms.QROrder.client.service.ClientQnaService;
import htms.QROrder.client.service.MenuDetailService;
import htms.QROrder.client.service.MenuMasterService;
import htms.QROrder.client.service.MenuOptionDetailService;
import htms.QROrder.client.service.MenuOptionGroupService;
import htms.QROrder.client.service.MenuOptionMasterService;
import htms.QROrder.common.controller.FileController;
import htms.QROrder.common.dto.AttachScope;
import htms.QROrder.common.dto.FileIO;
import htms.QROrder.common.dto.FileInfo;
import htms.QROrder.common.dto.FileRequest;
import htms.QROrder.common.exception.GlobalExceptionHandler;
import htms.QROrder.common.exception.ValidationException;
import htms.QROrder.common.repository.FileMapper;
import htms.QROrder.system.dto.NoticeRequest;
import htms.QROrder.system.repository.NoticeMapper;
import htms.QROrder.system.service.NoticeService;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.function.Executable;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.transaction.SpringManagedTransactionFactory;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.AnnotationTransactionAttributeSource;
import org.springframework.transaction.interceptor.TransactionInterceptor;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.FileSystemUtils;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the save scope for shared attachments.
 * Real PostgreSQL + real FileMapper.xml + real file system under build/tmp.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AttachFileDeleteScopePersistenceTest {

    private static final String PLANT = "STORE-A";
    private static final String FOREIGN_PLANT = "STORE-B";
    private static final AttachScope STORE_SCOPE = new AttachScope(PLANT, "LINK-A");
    private static final byte[] PNG = Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB2sAAAAASUVORK5CYII=");

    LocalPostgresTestSupport database;
    JdbcTemplate jdbc;
    FileService fileService;
    NoticeService noticeService;
    MenuDetailService menuDetailService;
    ClientQnaService qnaService;
    DataSourceTransactionManager manager;
    MockMvc mvc;
    Path root;
    Path uploadRoot;
    Path outsideRoot;

    @BeforeAll
    void start() throws Exception {
        database = LocalPostgresTestSupport.start();
        try {
            var source = (DriverManagerDataSource) database.dataSource();
            source.setUrl(source.getUrl().replace("currentSchema=qa_auth", "currentSchema=public"));
            jdbc = new JdbcTemplate(source);
            // Minimum fixture copied from qr_schema.sql column definitions. No shared DB/config is read.
            jdbc.execute("""
                create table public.sys_user(user_id varchar(50), user_nm varchar(50));
                create table public.attach_file(
                    sys_id varchar(36) primary key, link_sys_id varchar(36) not null,
                    original_file_nm varchar(200) not null, convert_file_nm varchar(36) not null,
                    file_ext varchar(50) not null, mime_type varchar(255) not null, file_size varchar(50) not null,
                    file_path text not null, insert_user_id varchar(50) not null, insert_datetime timestamp not null,
                    modify_user_id varchar(50), modify_datetime timestamp, sys_plant_cd varchar(50),
                    ord_no integer not null, pdf_yn varchar(1) not null, delete_yn varchar(1) not null);
                create table public.brd_notice(
                    sys_id varchar(36) primary key, notice_title varchar(500) not null, notice_description text not null,
                    start_date date not null, delete_yn varchar(1) not null, use_yn varchar(1) not null,
                    file_ulid varchar(36) not null, insert_user_id varchar(50) not null, insert_datetime timestamp not null,
                    modify_user_id varchar(50), modify_datetime timestamp, sys_plant_cd varchar(50),
                    target varchar(10) default 'all' not null);
                create table public.store_menu_detail(
                    file_ulid varchar(36) not null, sys_plant_cd varchar(50), delete_yn varchar(1) not null);
                create table public.store_menu_option_detail(
                    sys_id varchar(36) primary key, link_sys_id varchar(36) not null,
                    menu_option_name varchar(100) not null, menu_option_price integer not null,
                    menu_description text, maximum_num integer not null, default_yn varchar(1) not null,
                    sold_out_yn varchar(1) not null, use_yn varchar(1) not null, ord_no integer not null,
                    delete_yn varchar(1) not null, file_ulid varchar(36) not null,
                    insert_datetime timestamp not null, insert_user_id varchar(50) not null,
                    modify_datetime timestamp, modify_user_id varchar(50), sys_plant_cd varchar(50));
                create table public.brd_qna(
                    sys_id varchar(36) primary key, qna_title varchar(500) not null, qna_description text not null,
                    delete_yn varchar(1) not null, file_ulid varchar(36), answer_yn varchar(1) not null,
                    answer_user_id varchar(50), answer_datetime timestamp, answer_description text,
                    insert_datetime timestamp not null, insert_user_id varchar(50) not null,
                    modify_datetime timestamp, modify_user_id varchar(50), sys_plant_cd varchar(50));
                """);

            var factory = new SqlSessionFactoryBean();
            factory.setDataSource(source);
            var configuration = new Configuration();
            configuration.setMapUnderscoreToCamelCase(true);
            factory.setConfiguration(configuration);
            factory.setTransactionFactory(new SpringManagedTransactionFactory());
            factory.setMapperLocations(new ClassPathResource("mapper/common/FileMapper.xml"),
                    new ClassPathResource("mapper/system/NoticeMapper.xml"),
                    new ClassPathResource("mapper/client/MenuDetailMapper.xml"),
                    new ClassPathResource("mapper/client/MenuOptionDetailMapper.xml"),
                    new ClassPathResource("mapper/client/ClientQnaMapper.xml"));
            var sql = new SqlSessionTemplate(factory.getObject());

            Path tmp = Files.createDirectories(Path.of("build", "tmp")).toRealPath();
            root = Files.createTempDirectory(tmp, "attach-scope-");
            uploadRoot = root.resolve("upload");
            outsideRoot = root.resolve("outside");

            var io = new FileIOService();
            ReflectionTestUtils.setField(io, "uploadPath", uploadRoot.toString());
            var target = new FileService(sql.getMapper(FileMapper.class), io, mock(AuditService.class),
                    mock(PdfConvertService.class), mock(FileValidationService.class));
            manager = new DataSourceTransactionManager(source);
            fileService = transactional(target, manager);
            noticeService = transactional(new NoticeService(sql.getMapper(NoticeMapper.class),
                    mock(AuditService.class), target), manager);
            menuDetailService = transactional(new MenuDetailService(mock(AuditService.class),
                    sql.getMapper(MenuDetailMapper.class), fileService), manager);
            var optionService = transactional(new MenuOptionDetailService(mock(AuditService.class),
                    sql.getMapper(MenuOptionDetailMapper.class), fileService), manager);
            qnaService = transactional(new ClientQnaService(mock(AuditService.class),
                    sql.getMapper(ClientQnaMapper.class), fileService), manager);
            var menuController = new MenuManageController(mock(MenuMasterService.class), menuDetailService,
                    mock(MenuOptionMasterService.class), mock(MenuOptionGroupService.class), optionService);
            mvc = MockMvcBuilders.standaloneSetup(new FileController(fileService, optionService), menuController,
                            new BoardController(mock(ClientNoticeService.class), qnaService))
                    .setControllerAdvice(new GlobalExceptionHandler())
                    .build();
        } catch (Exception failure) {
            try {
                close();
            } catch (Exception cleanup) {
                failure.addSuppressed(cleanup);
            }
            throw failure;
        }
    }

    @SuppressWarnings("unchecked")
    private static <T> T transactional(T target, DataSourceTransactionManager manager) {
        var proxy = new ProxyFactory(target);
        proxy.setProxyTargetClass(true);
        proxy.addAdvice(new TransactionInterceptor(manager, new AnnotationTransactionAttributeSource()));
        return (T) proxy.getProxy();
    }

    @AfterAll
    void close() throws Exception {
        try (var cluster = database) {
            if (root != null) {
                FileSystemUtils.deleteRecursively(root);
            }
        }
    }

    @BeforeEach
    void reset() throws Exception {
        jdbc.update("delete from attach_file");
        jdbc.update("delete from brd_notice");
        jdbc.update("delete from store_menu_detail");
        jdbc.update("delete from store_menu_option_detail");
        jdbc.update("delete from brd_qna");
        Files.createDirectories(uploadRoot);
        Files.createDirectories(outsideRoot);
    }

    // (a) arbitrary path: the physical target must come from the stored row, never from request fields.

    @Test
    void forgedPathOutsideUploadRootIsNotDeleted() throws Exception {
        storeAttachment("OWN-1", "LINK-A", PLANT, "own1");
        Path victim = Files.writeString(outsideRoot.resolve("victim.txt"), "must survive");

        FileInfo forged = new FileInfo();
        forged.setSysId("OWN-1");
        forged.setFilePath(outsideRoot.toString());
        forged.setConvertFileNm("victim");
        forged.setFileExt(".txt");
        forged.setPdfYn("N");
        attempt(() -> fileService.saveFile(deleteRequest(forged), "USER-A", STORE_SCOPE, "FILE"));

        assertTrue(Files.exists(victim), "file outside the upload root was deleted through request filePath");
    }

    @Test
    void physicalDeleteUsesStoredRowWhenRequestCarriesOnlyId() throws Exception {
        Path stored = storeAttachment("OWN-2", "LINK-A", PLANT, "own2");

        FileInfo idOnly = new FileInfo();
        idOnly.setSysId("OWN-2");
        Throwable thrown = attempt(() -> fileService.saveFile(deleteRequest(idOnly), "USER-A", STORE_SCOPE, "FILE"));

        assertAll(
                () -> assertNull(thrown, "own-plant delete must succeed"),
                () -> assertEquals("Y", deleteYn("OWN-2")),
                () -> assertFalse(Files.exists(stored), "stored file must be removed using the DB path"));
    }

    @Test
    void convertedAttachmentDeletesOriginalAndPdfAfterCommit() throws Exception {
        Path original = storeAttachment("PDF-A", "LINK-A", PLANT, "converted-a");
        Path converted = Files.writeString(original.resolveSibling("converted-a.pdf"), "%PDF-1.4");
        jdbc.update("update attach_file set pdf_yn='Y' where sys_id='PDF-A'");

        new TransactionTemplate(manager).executeWithoutResult(status -> {
            fileService.saveFile(deleteRequest(orderChange("PDF-A", 1)), "USER-A", STORE_SCOPE, "FILE");
            assertAll(() -> assertTrue(Files.exists(original)), () -> assertTrue(Files.exists(converted)));
        });

        assertAll(
                () -> assertEquals("Y", deleteYn("PDF-A")),
                () -> assertFalse(Files.exists(original)),
                () -> assertFalse(Files.exists(converted)));
    }

    // (b) cross plant: an attachment owned by another plant must be rejected with no DB or disk change.

    @Test
    void crossPlantDeleteIsRejectedAndChangesNothing() throws Exception {
        Path stored = storeAttachment("FOREIGN-1", "LINK-B", FOREIGN_PLANT, "foreign1");

        Throwable thrown = attempt(() -> fileService.saveFile(
                deleteRequest(asRequested("FOREIGN-1", stored)), "USER-A", STORE_SCOPE, "FILE"));

        assertUntouched(thrown, "FOREIGN-1", stored);
    }

    // (c) wrong parent: deleting through notice N1 must not touch an attachment linked to notice N2.

    @Test
    void noticeUpdateRejectsAttachmentOfAnotherNotice() throws Exception {
        storeNotice("N1", "LINK-N1");
        storeNotice("N2", "LINK-N2");
        Path stored = storeAttachment("N2-FILE", "LINK-N2", "ADMIN", "n2file");

        Throwable thrown = attempt(() -> noticeService.updateNotice(noticeEdit("N1", "LINK-N1"),
                deleteRequest(asRequested("N2-FILE", stored)), "SYSTEM", "ADMIN", "NOTICE"));

        assertUntouched(thrown, "N2-FILE", stored);
    }

    @Test
    void noticeUpdateIgnoresParentIdSuppliedInRequest() throws Exception {
        storeNotice("N1", "LINK-N1");
        storeNotice("N2", "LINK-N2");
        Path stored = storeAttachment("N2-FILE", "LINK-N2", "ADMIN", "n2file");

        // Request claims N1's attachment group is LINK-N2. The stored N1.file_ulid must win.
        Throwable thrown = attempt(() -> noticeService.updateNotice(noticeEdit("N1", "LINK-N2"),
                deleteRequest(asRequested("N2-FILE", stored)), "SYSTEM", "ADMIN", "NOTICE"));

        assertUntouched(thrown, "N2-FILE", stored);
    }

    // Positive control: the legitimate flow must keep working before and after the fix.

    @Test
    void noticeUpdateDeletesItsOwnAttachment() throws Exception {
        storeNotice("N1", "LINK-N1");
        Path stored = storeAttachment("N1-FILE", "LINK-N1", "ADMIN", "n1file");

        Throwable thrown = attempt(() -> noticeService.updateNotice(noticeEdit("N1", "LINK-N1"),
                deleteRequest(asRequested("N1-FILE", stored)), "SYSTEM", "ADMIN", "NOTICE"));

        assertAll(
                () -> assertNull(thrown, "own attachment delete must succeed"),
                () -> assertEquals("Y", deleteYn("N1-FILE")),
                () -> assertFalse(Files.exists(stored)));
    }

    @Test
    void mixedParentUpdatesRejectAllChangesBeforeUploading() throws Exception {
        Path own = storeAttachment("UPDATE-A", "LINK-A", PLANT, "update-a");
        Path other = storeAttachment("UPDATE-B", "LINK-B", PLANT, "update-b");
        var request = new FileRequest();
        request.setUpdateItems(List.of(orderChange("UPDATE-A", 2), orderChange("UPDATE-B", 3)));
        request.setNewItems(List.of(upload(null, "mixed-upload")));

        var thrown = assertThrows(ResponseStatusException.class,
                () -> fileService.saveFile(request, "USER-A", STORE_SCOPE, "FILE"));

        assertUntouched(thrown, "UPDATE-A", own);
        assertUntouched(thrown, "UPDATE-B", other);
        assertAll(
                () -> assertEquals(404, thrown.getStatusCode().value()),
                () -> assertEquals(1, orderNo("UPDATE-A")),
                () -> assertEquals(1, orderNo("UPDATE-B")),
                () -> assertEquals(2, attachmentCount()),
                () -> assertFalse(Files.exists(uploadRoot.resolve("FILE/mixed-upload.txt"))));
    }

    @Test
    void mismatchedNewLinkRejectsUploadAndDeleteTogether() throws Exception {
        Path own = storeAttachment("KEEP-A", "LINK-A", PLANT, "keep-a");
        var request = deleteRequest(orderChange("KEEP-A", 1));
        request.setNewItems(List.of(upload("LINK-B", "wrong-link-upload")));

        var thrown = assertThrows(ResponseStatusException.class,
                () -> fileService.saveFile(request, "USER-A", STORE_SCOPE, "FILE"));

        assertUntouched(thrown, "KEEP-A", own);
        assertAll(
                () -> assertEquals(404, thrown.getStatusCode().value()),
                () -> assertEquals(1, attachmentCount()),
                () -> assertFalse(Files.exists(uploadRoot.resolve("FILE/wrong-link-upload.txt"))));
    }

    @Test
    void ownedUpdatesAndUploadUseTheStoredMenuLink() throws Exception {
        Path first = storeAttachment("MENU-A1", "LINK-A", PLANT, "menu-a1");
        Path second = storeAttachment("MENU-A2", "LINK-A", PLANT, "menu-a2");
        jdbc.update("insert into store_menu_detail values ('LINK-A', ?, 'N')", PLANT);
        var request = new FileRequest();
        request.setLinkSysId("LINK-A");
        request.setUpdateItems(List.of(orderChange("MENU-A1", 2), orderChange("MENU-A2", 3)));
        request.setNewItems(List.of(upload(null, "menu-upload")));

        menuDetailService.saveMenuDetail(new MenuDetailRequest(), request, "USER-A", PLANT, "FILE");

        assertAll(
                () -> assertEquals(2, orderNo("MENU-A1")),
                () -> assertEquals(3, orderNo("MENU-A2")),
                () -> assertTrue(Files.exists(first)),
                () -> assertTrue(Files.exists(second)),
                () -> assertEquals(3, attachmentCount()),
                () -> assertEquals("LINK-A", jdbc.queryForObject(
                        "select link_sys_id from attach_file where convert_file_nm='menu-upload' and sys_plant_cd=?",
                        String.class, PLANT)),
                () -> assertTrue(Files.exists(uploadRoot.resolve("FILE/menu-upload.txt"))));
    }

    @Test
    void uploadWithParentDirectoryInRequestUsesOnlyServerDirectory() throws Exception {
        var item = upload(null, "server-directory");
        item.setFilePath(Path.of("..", "outside").toString());
        var request = new FileRequest();
        request.setNewItems(List.of(item));

        fileService.saveFile(request, "USER-A", STORE_SCOPE, "FILE");

        Path directory = uploadRoot.resolve("FILE");
        assertAll(
                () -> assertEquals(directory.toString(), jdbc.queryForObject(
                        "select file_path from attach_file where convert_file_nm='server-directory'", String.class)),
                () -> assertTrue(Files.exists(directory.resolve("server-directory.txt"))),
                () -> assertFalse(Files.exists(outsideRoot.resolve("server-directory.txt"))));
    }

    @Test
    void uploadRejectsUnsafeStoredNamesWithoutWritingRowsOrFiles() throws Exception {
        long filesBefore = fileCount();
        for (String name : List.of("..", "...", "a/b", "..\\x", "a:b", "a<b", "a*b", "a%2e", "a\u0000b", "a\nb")) {
            var request = new FileRequest();
            request.setNewItems(List.of(upload(null, name)));

            var thrown = assertThrows(ValidationException.class,
                    () -> fileService.saveFile(request, "USER-A", STORE_SCOPE, "FILE"), name);

            assertAll(name,
                    () -> assertEquals("첨부파일 이름이 올바르지 않습니다.", thrown.getMessage()),
                    () -> assertEquals(0, attachmentCount()),
                    () -> assertEquals(filesBefore, fileCount()));
        }
    }

    @Test
    void uploadAcceptsKoreanDigitsSpaceAndAllowedPunctuation() throws Exception {
        var request = new FileRequest();
        request.setNewItems(List.of(upload(null, "한글 파일-1_(2).v")));

        fileService.saveFile(request, "USER-A", STORE_SCOPE, "FILE");

        assertAll(
                () -> assertEquals(1, attachmentCount()),
                () -> assertTrue(Files.exists(uploadRoot.resolve("FILE").resolve("한글 파일-1_(2).v.txt"))));
    }

    @Test
    void rollBackKeepsThePhysicalFile() throws Exception {
        Path stored = storeAttachment("ROLLBACK-A", "LINK-A", PLANT, "rollback-a");
        var transaction = new TransactionTemplate(manager);

        transaction.executeWithoutResult(status -> {
            fileService.saveFile(deleteRequest(orderChange("ROLLBACK-A", 1)), "USER-A", STORE_SCOPE, "FILE");
            assertEquals("Y", deleteYn("ROLLBACK-A"));
            assertTrue(Files.exists(stored), "physical file must survive until commit");
            status.setRollbackOnly();
        });

        assertAll(
                () -> assertEquals("N", deleteYn("ROLLBACK-A")),
                () -> assertTrue(Files.exists(stored)));
    }

    @Test
    void concurrentDeleteWaitsForTheOwnerTransaction() throws Exception {
        Path stored = storeAttachment("CONCURRENT-A", "LINK-A", PLANT, "concurrent-a");
        var transaction = new TransactionTemplate(manager);

        transaction.executeWithoutResult(status -> {
            fileService.saveFile(deleteRequest(orderChange("CONCURRENT-A", 1)), "USER-A", STORE_SCOPE, "FILE");
            var competingDelete = CompletableFuture.supplyAsync(() -> attempt(() ->
                    transaction.executeWithoutResult(other -> {
                        jdbc.execute("set local lock_timeout = '500ms'");
                        fileService.saveFile(deleteRequest(orderChange("CONCURRENT-A", 1)), "USER-B", STORE_SCOPE, "FILE");
                    })));
            Throwable failure = competingDelete.orTimeout(5, TimeUnit.SECONDS).join();
            assertNotNull(failure);
            var lockFailure = assertInstanceOf(SQLException.class, NestedExceptionUtils.getMostSpecificCause(failure));
            assertEquals("55P03", lockFailure.getSQLState());
            assertTrue(Files.exists(stored));
        });

        var retry = assertThrows(ResponseStatusException.class,
                () -> fileService.saveFile(deleteRequest(orderChange("CONCURRENT-A", 1)), "USER-B", STORE_SCOPE, "FILE"));
        assertAll(
                () -> assertEquals(404, retry.getStatusCode().value()),
                () -> assertEquals("Y", deleteYn("CONCURRENT-A")),
                () -> assertFalse(Files.exists(stored)));
    }

    @Test
    void storedPathOutsideUploadRootIsSkipped() throws Exception {
        storeAttachment("LEGACY-A", "LINK-A", PLANT, "legacy-a");
        Path outside = Files.writeString(outsideRoot.resolve("legacy-a.txt"), "keep");
        jdbc.update("update attach_file set file_path=? where sys_id='LEGACY-A'", outsideRoot.toString());

        fileService.saveFile(deleteRequest(orderChange("LEGACY-A", 1)), "USER-A", STORE_SCOPE, "FILE");

        assertAll(
                () -> assertEquals("Y", deleteYn("LEGACY-A")),
                () -> assertTrue(Files.exists(outside)));
    }

    @Test
    void detachedSaveRequiresTopLevelLink() throws Exception {
        Path stored = storeAttachment("OPT-MISSING", "OPT-A", PLANT, "missing-link");
        storeOptionParent("OPT-A", PLANT);

        var result = mvc.perform(detachedDelete("OPT-MISSING")).andExpect(status().isBadRequest()).andReturn();

        assertUntouched(result.getResolvedException(), "OPT-MISSING", stored);
    }

    @Test
    void detachedSaveChecksOptionParentAgainstSessionPlant() throws Exception {
        Path stored = storeAttachment("OPT-FOREIGN", "OPT-B", FOREIGN_PLANT, "foreign-option");
        storeOptionParent("OPT-B", FOREIGN_PLANT);

        var result = mvc.perform(detachedDelete("OPT-FOREIGN").param("linkSysId", "OPT-B"))
                .andExpect(status().isNotFound()).andReturn();

        assertUntouched(result.getResolvedException(), "OPT-FOREIGN", stored);
    }

    @Test
    void detachedSaveDeletesAnAttachmentOfTheOwnedOption() throws Exception {
        Path stored = storeAttachment("OPT-OWN", "OPT-A", PLANT, "owned-option");
        storeOptionParent("OPT-A", PLANT);

        mvc.perform(detachedDelete("OPT-OWN").param("linkSysId", "OPT-A")).andExpect(status().isOk());

        assertAll(
                () -> assertEquals("Y", deleteYn("OPT-OWN")),
                () -> assertFalse(Files.exists(stored)));
    }

    @Test
    void newOptionAndPngCommitUnderThePersistedOptionLink() throws Exception {
        mvc.perform(newOptionWithPng("new-option")).andExpect(status().isOk());

        String fileUlid = jdbc.queryForObject("""
                select file_ulid from store_menu_option_detail
                where link_sys_id='OPTION-GROUP' and sys_plant_cd=? and delete_yn='N'
                """, String.class, PLANT);
        Path stored = uploadRoot.resolve("FILE/new-option.png");
        assertAll(
                () -> assertEquals(1, attachmentCount()),
                () -> assertNotEquals("OPTION-GROUP", fileUlid),
                () -> assertEquals(fileUlid, jdbc.queryForObject("""
                        select link_sys_id from attach_file where sys_plant_cd=? and delete_yn='N'
                        """, String.class, PLANT)),
                () -> assertArrayEquals(PNG, Files.readAllBytes(stored)));

        String attachmentId = jdbc.queryForObject("select sys_id from attach_file", String.class);
        mvc.perform(multipart("/api/client/menu_manage/option/detail/save")
                        .param("linkSysId", fileUlid)
                        .param("delItems[0].sysId", attachmentId)
                        .sessionAttr("loginUser", login()).sessionAttr("menuCd", "FILE"))
                .andExpect(status().isOk());
        assertAll(() -> assertEquals("Y", deleteYn(attachmentId)), () -> assertFalse(Files.exists(stored)));
    }

    @Test
    void newOptionWithForeignAttachmentLinkRollsBackWithoutWritingPng() throws Exception {
        storeOptionParent("FOREIGN-OPTION", FOREIGN_PLANT);

        mvc.perform(newOptionWithPng("foreign-option-upload").param("linkSysId", "FOREIGN-OPTION"))
                .andExpect(status().isNotFound());

        assertAll(
                () -> assertEquals(0, jdbc.queryForObject(
                        "select count(*) from store_menu_option_detail where sys_plant_cd=?", Integer.class, PLANT)),
                () -> assertEquals(0, attachmentCount()),
                () -> assertFalse(Files.exists(uploadRoot.resolve("FILE/foreign-option-upload.png"))));
    }

    @Test
    void deletingInquiryRemovesOnlyItsOriginalAttachmentsAfterCommit() throws Exception {
        mvc.perform(multipart("/api/client/board/qna/new")
                        .file(png("inquiry"))
                        .param("qnaTitle", "Inquiry with PNG").param("qnaDescription", "Body")
                        .sessionAttr("loginUser", login()))
                .andExpect(status().isOk());
        String qnaId = jdbc.queryForObject("select sys_id from brd_qna", String.class);
        String fileUlid = jdbc.queryForObject("select file_ulid from brd_qna", String.class);
        String attachmentId = jdbc.queryForObject("select sys_id from attach_file", String.class);
        String storedName = jdbc.queryForObject("select convert_file_nm from attach_file", String.class);
        Path stored = uploadRoot.resolve("QNA").resolve(storedName + ".png");
        Path secondOriginal = storeAttachment("QNA-SECOND", fileUlid, PLANT, "qna-second");
        Path neighbor = storeAttachment("QNA-OTHER", "OTHER-QNA", PLANT, "qna-other");
        Path foreign = storeAttachment("QNA-FOREIGN", fileUlid, FOREIGN_PLANT, "qna-foreign");
        assertArrayEquals(PNG, Files.readAllBytes(stored));

        new TransactionTemplate(manager).executeWithoutResult(status -> {
            var request = new ClientQnaRequest();
            request.setSysId(qnaId);
            qnaService.delQna(request, "USER-A", PLANT, "QNA");
            assertAll(
                    () -> assertEquals("Y", inquiryDeleteYn()),
                    () -> assertEquals("Y", deleteYn(attachmentId)),
                    () -> assertTrue(Files.exists(stored)));
            status.setRollbackOnly();
        });
        assertAll(() -> assertEquals("N", inquiryDeleteYn()), () -> assertEquals("N", deleteYn(attachmentId)),
                () -> assertTrue(Files.exists(stored)));

        mvc.perform(post("/api/client/board/qna/del")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sysId":"%s","fileUlid":"OTHER-QNA"}
                                """.formatted(qnaId))
                        .sessionAttr("loginUser", login()).sessionAttr("menuCd", "QNA"))
                .andExpect(status().isOk());

        assertAll(
                () -> assertEquals("Y", inquiryDeleteYn()),
                () -> assertEquals("Y", deleteYn(attachmentId)),
                () -> assertEquals("Y", deleteYn("QNA-SECOND")),
                () -> assertFalse(Files.exists(stored)),
                () -> assertFalse(Files.exists(secondOriginal)),
                () -> assertEquals("N", deleteYn("QNA-OTHER")),
                () -> assertTrue(Files.exists(neighbor)),
                () -> assertEquals("N", deleteYn("QNA-FOREIGN")),
                () -> assertTrue(Files.exists(foreign)));
    }

    private String inquiryDeleteYn() {
        return jdbc.queryForObject("select delete_yn from brd_qna", String.class);
    }

    private void storeOptionParent(String fileUlid, String plant) {
        jdbc.update("""
                insert into store_menu_option_detail(sys_id, link_sys_id, menu_option_name, menu_option_price,
                    maximum_num, default_yn, sold_out_yn, use_yn, ord_no, delete_yn, file_ulid,
                    insert_datetime, insert_user_id, sys_plant_cd)
                values (?, 'OPTION-GROUP', ?, 100, 1, 'N', 'N', 'Y', 1, 'N', ?, now(), 'USER-A', ?)
                """, fileUlid + "-ROW", fileUlid, fileUlid, plant);
    }

    private static MockMultipartHttpServletRequestBuilder newOptionWithPng(String name) {
        var request = multipart("/api/client/menu_manage/option/detail/save").file(png(name));
        request.param("newItems[0].linkSysId", "OPTION-GROUP")
                .param("newItems[0].menuOptionName", name)
                .param("newItems[0].menuOptionPrice", "100")
                .param("newItems[0].maximumNum", "1")
                .param("newItems[0].defaultYn", "N")
                .param("newItems[0].soldOutYn", "N")
                .param("newItems[0].useYn", "N")
                .param("newItems[0].ordNo", "1")
                .param("newItems[0].convertFileNm", name)
                .sessionAttr("loginUser", login()).sessionAttr("menuCd", "FILE");
        return request;
    }

    private static MockMultipartFile png(String name) {
        return new MockMultipartFile("newItems[0].file", name + ".png", "image/png", PNG);
    }

    private static MockMultipartHttpServletRequestBuilder detachedDelete(String sysId) {
        var request = multipart("/api/attach_file/save");
        request.param("delItems[0].sysId", sysId).sessionAttr("loginUser", login()).sessionAttr("menuCd", "FILE");
        return request;
    }

    private static Login login() {
        var login = new Login();
        login.setUserId("USER-A");
        login.setSysPlantCd(PLANT);
        return login;
    }

    private static FileInfo orderChange(String sysId, int orderNo) {
        var info = new FileInfo();
        info.setSysId(sysId);
        info.setOrdNo(orderNo);
        return info;
    }

    private static FileIO upload(String linkSysId, String name) {
        var item = new FileIO();
        item.setFile(new MockMultipartFile("file", name + ".txt", "text/plain", new byte[] {1}));
        item.setLinkSysId(linkSysId);
        item.setConvertFileNm(name);
        item.setFilePath("/2026/11");
        item.setOrdNo(1);
        return item;
    }

    private int orderNo(String sysId) {
        return jdbc.queryForObject("select ord_no from attach_file where sys_id=?", Integer.class, sysId);
    }

    private long fileCount() throws Exception {
        try (var files = Files.walk(uploadRoot)) {
            return files.filter(Files::isRegularFile).count();
        }
    }

    private int attachmentCount() {
        return jdbc.queryForObject("select count(*) from attach_file", Integer.class);
    }

    private void assertUntouched(Throwable thrown, String sysId, Path stored) {
        assertAll(
                () -> assertNotNull(thrown, "out-of-scope delete must be rejected"),
                () -> assertEquals("N", deleteYn(sysId), "out-of-scope row was marked deleted"),
                () -> assertNull(jdbc.queryForObject("select modify_user_id from attach_file where sys_id=?",
                        String.class, sysId), "out-of-scope row was modified"),
                () -> assertTrue(Files.exists(stored), "out-of-scope physical file was deleted"));
    }

    private static Throwable attempt(Executable call) {
        try {
            call.execute();
            return null;
        } catch (Throwable failure) {
            return failure;
        }
    }

    /** Creates a row and its physical file the way FileService.newFile lays them out. */
    private Path storeAttachment(String sysId, String linkSysId, String plant, String convertNm) throws Exception {
        Path dir = Files.createDirectories(uploadRoot.resolve("NOTICE").resolve(sysId));
        Path file = Files.writeString(dir.resolve(convertNm + ".txt"), sysId);
        jdbc.update("""
                insert into attach_file(sys_id, link_sys_id, original_file_nm, convert_file_nm, file_ext, mime_type,
                    file_size, file_path, insert_user_id, insert_datetime, sys_plant_cd, ord_no, pdf_yn, delete_yn)
                values (?, ?, 'original', ?, '.txt', 'text/plain', '0.00', ?, 'OWNER', now(), ?, 1, 'N', 'N')
                """, sysId, linkSysId, convertNm, dir.toString(), plant);
        return file;
    }

    private void storeNotice(String sysId, String fileUlid) {
        jdbc.update("""
                insert into brd_notice(sys_id, notice_title, notice_description, start_date, delete_yn, use_yn,
                    file_ulid, insert_user_id, insert_datetime, sys_plant_cd)
                values (?, 'title', 'body', current_date, 'N', 'Y', ?, 'SYSTEM', now(), 'ADMIN')
                """, sysId, fileUlid);
    }

    /** What the UI sends today: the row fields as read back from getAttachFile. */
    private static FileInfo asRequested(String sysId, Path stored) {
        FileInfo info = new FileInfo();
        info.setSysId(sysId);
        info.setFilePath(stored.getParent().toString());
        String name = stored.getFileName().toString();
        info.setConvertFileNm(name.substring(0, name.lastIndexOf('.')));
        info.setFileExt(".txt");
        info.setPdfYn("N");
        return info;
    }

    private static FileRequest deleteRequest(FileInfo... items) {
        FileRequest request = new FileRequest();
        request.setDelItems(List.of(items));
        return request;
    }

    private static NoticeRequest noticeEdit(String sysId, String requestFileUuid) {
        NoticeRequest request = new NoticeRequest();
        request.setSysId(sysId);
        request.setNoticeTitle("edited");
        request.setNoticeDescription("body");
        request.setUseYn("Y");
        request.setStartDate(LocalDateTime.now().minusDays(1));
        request.setFileUuid(requestFileUuid);
        return request;
    }

    private String deleteYn(String sysId) {
        return jdbc.queryForObject("select delete_yn from attach_file where sys_id=?", String.class, sysId);
    }
}
