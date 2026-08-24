/**
 * @fileoverview Consumer 헤더(검색·카테고리 탭)와 order-shell(메뉴 필터링)이 공유하는 상태
 *
 * @description
 * 참고 저장소는 로고·매장정보·검색·카테고리 탭이 한 헤더 블록이라, 이 프로젝트도 같은 레이아웃을
 * 내려고 검색·카테고리 UI를 ConsumerHeader(레이아웃)로 옮겼다. 하지만 실제 필터링은 여전히
 * order-shell(useConsumerOrderPage)이 담당하는 페이지 콘텐츠 관심사라 상태만 스토어로 공유한다.
 */
import { create } from 'zustand';

type ConsumerOrderFilterStore = {
  searchQuery: string;
  selectedCategory: string;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
};

export const useConsumerOrderFilterStore = create<ConsumerOrderFilterStore>((set) => ({
  searchQuery: '',
  selectedCategory: '전체',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
}));
