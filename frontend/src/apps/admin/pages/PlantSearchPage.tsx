import { startTransition, useState } from 'react';
import AdminMainLayout from '@/apps/admin/layout/AdminMainLayout';
import '@/apps/admin/pages/PlantSearchPage.css';
import { Icon } from '@/shared/assets/icons/Icon';
import { Button } from '@/shared/components/button';
import { InputBase } from '@/shared/components/input';

type PlantRow = {
  businessCode: string;
  businessName: string;
  storeName: string;
  ownerName: string;
  email: string;
  managerName: string;
  postalCode: string;
  address: string;
  phoneNumber: string;
};

const PLANT_ROWS: PlantRow[] = [
  {
    businessCode: 'BIZ-001',
    businessName: '(주)스마트푸드시스템',
    storeName: '스마트버거 강남점',
    ownerName: '김민준',
    email: 'info@smartfood.kr',
    managerName: '이서연',
    postalCode: '06100',
    address: '서울 강남구 테헤란로 123',
    phoneNumber: '02-1234-5678',
  },
  {
    businessCode: 'BIZ-003',
    businessName: '(주)더맛집컴퍼니',
    storeName: '더맛집 삼겹살',
    ownerName: '이준혁',
    email: 'info@thematjip.kr',
    managerName: '정수현',
    postalCode: '03992',
    address: '서울 마포구 합정동 23번길',
    phoneNumber: '02-7777-8888',
  },
  {
    businessCode: 'BIZ-004',
    businessName: '(주)오더브릿지',
    storeName: '오더브릿지 판교점',
    ownerName: '박지호',
    email: 'hello@orderbridge.kr',
    managerName: '최윤아',
    postalCode: '13487',
    address: '경기 성남시 분당구 판교역로 221',
    phoneNumber: '031-555-0909',
  },
];

export function PlantSearchPage() {
  const [draftKeyword, setDraftKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  const normalizedKeyword = appliedKeyword.trim().toLowerCase();

  const filteredRows = PLANT_ROWS.filter((row) => {
    if (!normalizedKeyword) {
      return true;
    }

    return [row.businessName, row.storeName, row.ownerName].some((value) =>
      value.toLowerCase().includes(normalizedKeyword),
    );
  });

  const handleSearch = () => {
    startTransition(() => {
      setAppliedKeyword(draftKeyword);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      setDraftKeyword('');
      setAppliedKeyword('');
    });
  };

  return (
    <AdminMainLayout adminMainTitle="사업장 조회" depth1="시스템" depth2="시스템 관리">
      <section className="plant-search-page" aria-label="사업장 조회 화면">
        <article className="plant-search-page__filter-card" aria-label="사업장 검색">
          <div className="plant-search-page__search-field">
            <InputBase
              size="md"
              value={draftKeyword}
              className="plant-search-page__search-input"
              placeholder="사업자명, 상호명, 대표자명으로 검색"
              leftSlot={<Icon id="i-search" size={14} />}
              onChange={(event) => setDraftKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch();
                }
              }}
              aria-label="사업장 검색어"
            />
          </div>

          <div className="plant-search-page__filter-actions">
            <Button type="button" variant="outline" size="md" onClick={handleReset}>
              초기화
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Icon id="i-search" size={15} />}
              onClick={handleSearch}
            >
              조회
            </Button>
          </div>
        </article>

        <article className="plant-search-page__table-card" aria-label="사업장 목록">
          <header className="plant-search-page__table-header">
            <h2 className="plant-search-page__table-title">사업장 목록</h2>
          </header>

          <div className="plant-search-page__table-wrap">
            <table className="plant-search-page__table">
              <thead>
                <tr>
                  <th>사업자 코드</th>
                  <th>사업자 명</th>
                  <th>상호명</th>
                  <th>대표자명</th>
                  <th>이메일주소</th>
                  <th>담당자명</th>
                  <th>우편번호</th>
                  <th>주소</th>
                  <th>전화번호</th>
                  <th>클라이언트 접속</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <tr key={row.businessCode}>
                      <td className="plant-search-page__mono">{row.businessCode}</td>
                      <td>{row.businessName}</td>
                      <td>{row.storeName}</td>
                      <td>{row.ownerName}</td>
                      <td className="plant-search-page__muted">{row.email}</td>
                      <td>{row.managerName}</td>
                      <td className="plant-search-page__muted">{row.postalCode}</td>
                      <td className="plant-search-page__muted">{row.address}</td>
                      <td className="plant-search-page__muted">{row.phoneNumber}</td>
                      <td>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          className="plant-search-page__access-button"
                          rightIcon={<Icon id="i-plant-access" size={11} />}
                        >
                          접속
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="plant-search-page__empty" colSpan={10}>
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </AdminMainLayout>
  );
}
