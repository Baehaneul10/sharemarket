-- ============================================================
-- 영영상점 테스트용 시드 데이터
-- 사용법: schema.sql 실행 후 SQL Editor에 붙여넣고 Run
-- ============================================================

-- 매장 2개
insert into stores (name, brand, owner_name, phone, address, pickup_hours, openchat_url) values
('영영상점 테스트점', '영영상점', '김점주', '02-000-0000',  '서울시 송파구 위례성대로 1', '15:00~20:00', 'https://open.kakao.com/o/test'),
('영영상점 판교점',   '영영상점', '이점주', '031-000-0000', '경기도 성남시 분당구 판교로 2', '11:00~21:00', 'https://open.kakao.com/o/test2');

-- 상품 3개
insert into products (name, category, normal_price, group_price, supply_price, storage, origin, max_per_person, description, composition) values
('제주 흑돼지 양념구이 1kg',     '축산',   24900, 17900, 14000, '냉동', '국내산(제주)', 3, '제주 흑돼지 양념구이 1kg, 가정용 소분 포장', '흑돼지 양념구이 1kg'),
('수제 반찬 3종 세트',          '반찬',   15000, 11900,  9000, '냉장', '국내산',       5, '매일 만드는 수제 반찬 3종 세트', '반찬 3종 (각 200g)'),
('프리미엄 밀키트 부대찌개 2인', '밀키트', 13900,  9900,  7500, '냉장', '국내산',       5, '2인분 밀키트, 데우기만 하면 완성', '부대찌개 밀키트 2인분');

-- 공구 회차: 모든 상품에 1차 공구 생성 (오늘 시작, 내일 마감, 모레 픽업)
insert into group_buys (product_id, title, sale_start, sale_end, pickup_date, total_qty, status)
select id, name || ' 1차 공구', now(), now() + interval '1 day', (now() + interval '2 day')::date, 100, 'selling'
from products;
