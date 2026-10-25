# Kịch bản test — Chức năng Soạn bài (đề cương)

Phạm vi: trang danh sách `/curriculum` và trang chi tiết `/curriculum/:id`.
Hai trạng thái hiển thị: **Đã lưu** (không có nháp local) và **Chưa lưu** (có nháp trong `localStorage` key `educonnect-outline-drafts`).

## Tiền điều kiện chung

- API đang chạy và đã seed: `npx ts-node prisma/seed.ts` rồi `npx ts-node prisma/seed-chuong1.ts`.
- Đăng nhập tài khoản giáo viên `teacher@educonnect.local` / `Teacher@123`.
- Dữ liệu mẫu: đề cương **"Toán 12 - Ôn tập chương 1"** (1 chương, 6 bài, 44 câu hỏi) và ngân hàng câu hỏi chương 1.
- Cách xóa nháp khi cần reset: DevTools → Application → Local Storage → xóa key `educonnect-outline-drafts`.

## A. Trang danh sách đề cương

| ID | Kịch bản | Các bước | Kết quả mong đợi |
|----|----------|----------|-------------------|
| A1 | Hiển thị danh sách | Mở `/curriculum` | Bảng liệt kê đề cương với cột: checkbox, Tên, Chương, Câu hỏi, Trạng thái, Ngày tạo, Thao tác. Đề cương seed hiện badge **Đã lưu**. |
| A2 | Tìm kiếm theo tên | Nhập `toan 12` vào ô tìm | Chỉ còn các đề cương khớp (tìm không dấu vẫn khớp có dấu). |
| A3 | Xóa từ khóa tìm | Bấm icon ✕ trong ô tìm | Ô trống, danh sách hiện lại đầy đủ. |
| A4 | Lọc tab Đã lưu | Bấm tab **Đã lưu** | Chỉ hiện đề cương không có nháp; số đếm trên tab đúng. |
| A5 | Lọc tab Chưa lưu | Sửa 1 đề cương ở trang chi tiết (chưa lưu) → quay lại → bấm **Chưa lưu** | Đề cương vừa sửa xuất hiện badge **Chưa lưu** và nằm trong tab này. |
| A6 | Đếm trên các tab | So sánh số trên Tất cả / Đã lưu / Chưa lưu | Đã lưu + Chưa lưu = Tất cả. |
| A7 | Kết hợp tìm + lọc | Chọn tab Chưa lưu rồi gõ từ khóa không khớp | Hiện trạng thái trống "Không có đề cương phù hợp với bộ lọc". |
| A8 | Xem chi tiết | Bấm **Xem** (hoặc bấm tên đề cương) ở dòng "Toán 12 - Ôn tập chương 1" | Điều hướng `/curriculum/:id`, hiển thị đúng chương/bài/câu hỏi. |
| A9 | Tạo đề cương mới | Bấm **Tạo đề cương mới** → nhập tên + môn → **Tạo** | Chuyển sang trang chi tiết id `draft-*`; quay lại danh sách thấy đề cương mới đứng đầu, badge **Chưa lưu**. |
| A10 | Modal tạo — tên rỗng | Mở modal, để trống tên | Nút **Tạo** bị vô hiệu. |
| A11 | Chọn từng dòng | Tick checkbox 2 đề cương | Thanh thao tác hàng loạt hiện "Đã chọn 2 đề cương" + các nút Lưu / Xóa đã chọn / Bỏ chọn. |
| A12 | Chọn tất cả | Tick checkbox header | Tất cả dòng đang hiển thị được chọn; bỏ tick → bỏ chọn hết. |
| A13 | Bỏ chọn | Chọn vài dòng → bấm **Bỏ chọn** | Thanh hàng loạt biến mất, không dòng nào được chọn. |
| A14 | Lưu hàng loạt — có nháp | Tạo nháp cho 2 đề cương (sửa tiêu đề ở trang chi tiết, không lưu) → về danh sách → chọn 2 dòng → bấm **Lưu (2)** | Thông báo "Đã lưu 2 đề cương"; 2 dòng chuyển badge **Đã lưu**; nháp bị xóa khỏi localStorage. |
| A15 | Lưu hàng loạt — chọn cả đề cương mới | Tạo đề cương mới (chưa lưu) → chọn nó + 1 đề cương đã lưu → **Lưu** | Đề cương mới được tạo trên server (id thật), hiện **Đã lưu**; đề cương đã lưu bị bỏ qua; ghi chú "(1 đã lưu sẽ bỏ qua)". |
| A16 | Lưu hàng loạt — không có nháp | Chọn chỉ các dòng Đã lưu | Nút **Lưu** bị vô hiệu (hiển thị "Lưu" không có số). |
| A17 | Xóa 1 đề cương | Bấm icon thùng rác ở 1 dòng → xác nhận | Đề cương biến mất khỏi bảng; trên DB, chapter/lesson/lesson_question bị xóa cascade. |
| A18 | Xóa hàng loạt | Chọn 3 đề cương → **Xóa đã chọn** → xác nhận | 3 dòng biến mất, thông báo "Đã xóa 3 đề cương". |
| A19 | Hủy xóa | Bấm icon xóa → chọn **Hủy** trong dialog | Dialog đóng, dữ liệu giữ nguyên. |
| A20 | Xóa đề cương chỉ-có-nháp | Tạo đề cương mới (chưa lưu) → xóa ngay trên danh sách | Biến mất tức thì (không gọi API), nháp bị xóa. |

## B. Trang chi tiết đề cương

| ID | Kịch bản | Các bước | Kết quả mong đợi |
|----|----------|----------|-------------------|
| B1 | Hiển thị chi tiết | Mở `/curriculum/curr-toan12-c1` | Thanh trên cùng: nút quay lại, tên đề cương + icon bút, thống kê (môn, số chương/bài/câu hỏi, ngày tạo), chỉ báo **Đã lưu**, nút Lưu bị vô hiệu. Cột phải: panel Hướng dẫn nhanh. |
| B2 | Đổi tên đề cương | Bấm icon bút cạnh tên → sửa → Enter | Tên đổi ngay, chỉ báo chuyển **Chưa lưu thay đổi**, nút Lưu sáng. |
| B3 | Hủy đổi tên | Bấm icon bút → sửa → Esc | Tên giữ nguyên, không phát sinh nháp. |
| B4 | Thêm chương | Bấm **Thêm chương** → nhập tên → Enter/✓ | Chương mới xuất hiện cuối danh sách, trạng thái Chưa lưu. |
| B5 | Hủy thêm chương | Bấm Thêm chương → Esc | Ô nhập đóng, không có chương mới. |
| B6 | Đổi tên chương | Icon bút ở header chương → sửa → Enter | Tên chương đổi trong nháp. |
| B7 | Đóng/mở chương | Bấm header chương | Danh sách bài thu gọn/mở ra; **không** đánh dấu Chưa lưu (chỉ là state hiển thị). |
| B8 | Xóa chương rỗng | Xóa chương không có bài | Chương biến mất ngay, không hỏi xác nhận. |
| B9 | Xóa chương có bài | Xóa chương có ≥1 bài → xác nhận dialog | Dialog nhắc số bài bị xóa kèm; xác nhận → chương biến mất trong nháp. |
| B10 | Thêm bài | Trong chương, bấm **Thêm bài** → nhập tên → Enter | Bài mới thêm vào cuối chương, chip "0 câu". |
| B11 | Đổi tên bài | Icon bút ở header bài → sửa → Enter | Tên bài đổi trong nháp. |
| B12 | Xóa bài | Icon thùng rác ở header bài | Bài biến mất (kèm liên kết câu hỏi của nó). |
| B13 | Chọn câu hỏi | Bấm **Chọn câu hỏi** ở 1 bài → tick vài câu trong ngân hàng → **Xác nhận (n)** | Câu hỏi xuất hiện trong bài theo thứ tự, chip cập nhật số câu. |
| B14 | Chọn lại câu hỏi | Mở picker ở bài đã có câu hỏi | Các câu đã gắn được tick sẵn; bỏ tick → xác nhận → câu đó bị gỡ. |
| B15 | Gỡ câu hỏi | Icon ✕ cạnh 1 câu trong bài | Câu đó bị gỡ khỏi bài (nháp). |
| B16 | Câu hỏi đã bị xóa | Xóa 1 câu trong ngân hàng (`DELETE /question-bank/:id`) → mở đề cương chứa nó | Dòng câu hỏi hiện cảnh báo vàng "Câu hỏi đã bị xóa khỏi ngân hàng"; vẫn gỡ được. |
| B17 | Lưu bằng nút | Sửa vài thứ → bấm **Lưu** | Chỉ báo: Đang lưu… → **Đã lưu lúc HH:MM**; PUT `/curriculum/:id/structure` được gọi; nháp bị xóa. |
| B18 | Lưu bằng Ctrl+S | Sửa → nhấn Ctrl+S | Giống B17; trình duyệt không mở hộp thoại save. |
| B19 | Nháp sống qua reload | Sửa không lưu → F5 | Trang tải lại vẫn hiện bản nháp + **Chưa lưu thay đổi** (localStorage). |
| B20 | Nháp sống qua điều hướng | Sửa không lưu → về danh sách → mở lại đề cương | Nháp còn nguyên; ở danh sách dòng đó badge **Chưa lưu**. |
| B21 | Hủy thay đổi (đã từng lưu) | Sửa → **Hủy thay đổi** | Nháp bị xóa, nội dung quay về bản trên server, chỉ báo **Đã lưu**. |
| B22 | Hủy đề cương mới | Tạo đề cương mới → **Hủy thay đổi** → xác nhận | Dialog cảnh báo xóa hẳn; xác nhận → về danh sách, đề cương biến mất. |
| B23 | Lưu đề cương mới lần đầu | Tạo đề cương → thêm chương/bài/câu hỏi → **Lưu** | Gọi POST `/curriculum` rồi PUT structure; URL đổi từ `draft-*` sang id thật; chỉ báo Đã lưu. |
| B24 | Lưu thất bại | Tắt API → sửa → Lưu | Chỉ báo **Lưu thất bại — thử lại** + banner lỗi đỏ; nháp vẫn giữ, bật API lưu lại được. |
| B25 | Đề cương không tồn tại | Mở `/curriculum/id-bat-ky` | Hiện "Không tìm thấy đề cương" + nút về danh sách. |
| B26 | Panel hướng dẫn | Quan sát cột phải | 4 bước có số + mẹo; thu nhỏ cửa sổ → panel tự xuống dưới editor. |

## C. Ràng buộc dữ liệu & biên

| ID | Kịch bản | Kết quả mong đợi |
|----|----------|-------------------|
| C1 | Tên trống | Enter với ô tên rỗng (đề cương/chương/bài) không tạo item; modal tạo không submit. |
| C2 | Id chương/bài giả | Nháp chứa `new-*` id — khi Lưu, API tạo mới thay vì update. |
| C3 | Id lạ trong structure | PUT structure với chapter/lesson id không thuộc đề cương → service coi là phần tử mới (không update nhầm đề cương khác). |
| C4 | Câu hỏi lặp trong bài | Chọn cùng 1 câu ở picker → `lessonId_questionId` unique, không trùng dòng. |
| C5 | Lưu khi đang lưu | Bấm Lưu 2 lần liên tiếp | Chỉ 1 mutation chạy (nút vô hiệu khi pending). |
| C6 | Hai tab trình duyệt | Sửa ở tab 1 → tab 2 vẫn giữ localStorage riêng theo snapshot lần load — hành vi đã biết, nháp tab nào ghi đè tab đó. |

## Ghi chú

- Đáp án trắc nghiệm trong `seed-chuong1.ts` được chọn theo lời giải chuẩn; giáo viên nên rà soát lại trước khi dùng cho học sinh.
- B19–B20 kiểm chứng cơ chế nháp đồng bộ localStorage — trục chính của trạng thái **Chưa lưu**.
