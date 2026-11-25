package htms.QROrder.auth;

import org.springframework.jdbc.core.JdbcTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/** Team schema subset copied from qr_schema.sql (no FK/unique beyond PK, like the real copy). */
public final class TeamSchemaFixture {
    private TeamSchemaFixture() {}

    public static void createCoreTables(JdbcTemplate jdbc) {
        jdbc.execute("""
                create table public.sys_plant (
                    sys_id character varying(36) not null primary key,
                    plant_cd character varying(50) not null,
                    plant_nm character varying(200) not null,
                    use_yn character varying(1) not null,
                    delete_yn character varying(1) not null,
                    insert_datetime timestamp without time zone not null,
                    insert_user_id character varying(50) not null,
                    modify_datetime timestamp without time zone,
                    modify_user_id character varying(50),
                    email_url character varying(200),
                    emp_nm character varying(200),
                    zip_code character varying(200),
                    address character varying(1000),
                    phone_number integer,
                    emergency_phone_number integer,
                    reg_num character varying(30),
                    store_nm character varying(200) generated always as (plant_nm) stored,
                    open_time time without time zone,
                    close_time time without time zone);
                create table public.sys_user (
                    sys_id character varying(36) not null primary key,
                    user_id character varying(50) not null,
                    user_nm character varying(50) not null,
                    user_password character varying(200) not null,
                    insert_user_id character varying(50) not null,
                    modify_user_id character varying(50),
                    insert_datetime timestamp without time zone not null,
                    modify_datetime timestamp without time zone,
                    password_fail_cnt integer not null,
                    init_yn character varying(1) not null,
                    sys_plant_cd character varying(50),
                    plant_cd character varying(50),
                    delete_yn character varying(1) not null,
                    user_role character varying(50),
                    email character varying(200),
                    email_valid_yn character varying(1));
                create table public.sys_payment (
                    sys_id character varying(36) not null primary key,
                    payment_cd character varying(50) not null,
                    payment_nm character varying(200) not null,
                    payment_fee integer not null,
                    payment_fee_unit character varying(50) not null,
                    license_valid_month integer not null,
                    insert_user_id character varying(50) not null,
                    insert_datetime timestamp without time zone not null,
                    modify_user_id character varying(50),
                    modify_datetime timestamp without time zone,
                    sys_plant_cd character varying(50) not null,
                    delete_yn character varying(1));
                """);
    }

    public static String migration(String fileName) throws IOException {
        return Files.readString(Path.of("src", "main", "resources", "db", "migration", fileName), StandardCharsets.UTF_8);
    }
}
