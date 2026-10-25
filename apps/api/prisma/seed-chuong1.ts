import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed đề cương "Toán 12 - Ôn tập chương 1" (Ứng dụng đạo hàm) kèm ngân hàng
 * 44 câu hỏi trích từ docx/chuong1.docx. Chạy: npx ts-node prisma/seed-chuong1.ts
 * Script idempotent — upsert theo id cố định nên chạy lại không tạo bản trùng.
 * Nội dung câu hỏi đã được chuẩn hóa lại chính tả/công thức từ file docx gốc;
 * đáp án trắc nghiệm chọn theo lời giải chuẩn — giáo viên nên rà soát lại.
 */

// ── Ngân hàng câu hỏi ────────────────────────────────────────────
// type: SINGLE = trắc nghiệm 1 đáp án; FILL_BLANK = tự luận/trả lời ngắn.
interface Q {
  n: string; // số thứ tự câu trong docx (1.1 … 1.46)
  text: string;
  diff?: 'EASY' | 'MEDIUM' | 'HARD';
  options?: { text: string; correct?: boolean }[]; // có options ⇒ SINGLE
}

const BAI1: Q[] = [
  { n: '1.1', text: 'Tìm các khoảng đồng biến, khoảng nghịch biến của các hàm số có đồ thị cho sẵn: a) y = x² (H.1.11); b) y = (x² − 4) (H.1.12).', diff: 'EASY' },
  { n: '1.2', text: 'Xét sự đồng biến, nghịch biến của các hàm số sau: a) y = x³ − 2x² + 3x + 1; b) y = −x³ + 2x² − 5x + 3.', diff: 'EASY' },
  { n: '1.3', text: 'Tìm các khoảng đơn điệu của các hàm số sau: a) y = (2x − 1)/(x + 2); b) y = (x² + x + 4)/(x − 3).', diff: 'MEDIUM' },
  { n: '1.4', text: 'Xét chiều biến thiên của các hàm số sau: a) y = √(4 − x²); b) y = x + 1/x.', diff: 'MEDIUM' },
  { n: '1.5', text: 'Giả sử số dân của một thị trấn sau t năm kể từ năm 2000 được mô tả bởi hàm số N(t) = (25t + 10)/(t + 5), t ≥ 0 (N(t) tính bằng nghìn người). a) Tính số dân của thị trấn đó vào các năm 2000 và 2015. b) Tính đạo hàm N′(t) và lim N(t) khi t → +∞. Từ đó, giải thích tại sao số dân của thị trấn đó luôn tăng nhưng sẽ không vượt qua một ngưỡng nào đó.', diff: 'HARD' },
  { n: '1.6', text: 'Đồ thị của đạo hàm bậc nhất y = f′(x) của hàm số f(x) được cho trong Hình 1.13. a) Hàm số f(x) đồng biến trên những khoảng nào? Giải thích. b) Tại giá trị nào của x thì f(x) có cực đại hoặc cực tiểu? Giải thích.', diff: 'MEDIUM' },
  { n: '1.7', text: 'Tìm cực trị của các hàm số sau: a) y = 2x³ − 9x² + 12x − 5; b) y = x³ − 4x² + 2; c) y = (x² − 2x + 3)/(x − 1); d) y = √(4x − 2x²).', diff: 'MEDIUM' },
  { n: '1.8', text: 'Cho hàm số y = f(x) = |x|. a) Tính các giới hạn lim[x→0⁺] (f(x) − f(0))/(x − 0) và lim[x→0⁻] (f(x) − f(0))/(x − 0). Từ đó suy ra hàm số không có đạo hàm tại x = 0.', diff: 'MEDIUM' },
  { n: '1.9', text: 'Giả sử doanh số (tính bằng số sản phẩm) của một sản phẩm mới (trong vòng một số năm nhất định) tuân theo quy luật logistic được mô hình hóa bằng hàm số f(t) = 5000/(1 + 5e^(−t)), t ≥ 0, trong đó thời gian t tính bằng năm, kể từ khi phát hành sản phẩm mới. Khi đó, tốc độ bán hàng là lớn nhất tại thời điểm nào?', diff: 'HARD' },
];

const BAI2: Q[] = [
  { n: '1.10', text: 'Tìm giá trị lớn nhất và giá trị nhỏ nhất (nếu có) của các hàm số sau: a) y = −x² + 4x + 3; b) y = x³ − 2x² + 1 trên [0; +∞); c) y = (x² − 2x + 3)/(x − 1) trên (1; +∞); d) y = √(4x − 2x²).', diff: 'MEDIUM' },
  { n: '1.11', text: 'Tìm giá trị lớn nhất và giá trị nhỏ nhất (nếu có) của các hàm số sau: a) y = x − 2x² + 3; b) y = x·e^(−x); c) y = x·ln x; d) y = √(x − 1) + √(3 − x).', diff: 'MEDIUM' },
  { n: '1.12', text: 'Tìm giá trị lớn nhất và giá trị nhỏ nhất của các hàm số sau: a) y = 2x² − 6x + 3 trên đoạn [−1; 2]; b) y = x⁴ − 3x² + 2 trên đoạn [0; 3]; c) y = x − sin 2x trên đoạn [0; π]; d) y = (x² − x)·eˣ trên đoạn [0; 1].', diff: 'MEDIUM' },
  { n: '1.13', text: 'Trong các hình chữ nhật có chu vi là 24 cm, hãy tìm hình chữ nhật có diện tích lớn nhất.', diff: 'EASY' },
  { n: '1.14', text: 'Một nhà sản xuất muốn thiết kế một chiếc hộp có dạng hình hộp chữ nhật không có nắp, có đáy là hình vuông và diện tích bề mặt bằng 108 cm² (Hình 1.17). Tìm các kích thước của chiếc hộp sao cho thể tích của hộp là lớn nhất.', diff: 'HARD' },
  { n: '1.15', text: 'Một nhà sản xuất cần làm ra những chiếc bình có dạng hình trụ với dung tích 1 000 cm³. Tìm các kích thước của bình để chi phí vật liệu sản xuất mỗi chiếc bình là nhỏ nhất.', diff: 'HARD' },
];

const BAI3: Q[] = [
  { n: '1.16', text: 'Hình 1.26 là đồ thị của hàm số y = f(x) = (x² + 2x − 3)/(x² − 1). Sử dụng đồ thị này, hãy: a) Viết kết quả của các giới hạn: lim[x→−∞] f(x); lim[x→+∞] f(x); lim[x→1⁻] f(x); lim[x→1⁺] f(x). b) Chỉ ra các tiệm cận của đồ thị hàm số đã cho.', diff: 'MEDIUM' },
  { n: '1.17', text: 'Đường thẳng x = 1 có phải là tiệm cận đứng của đồ thị hàm số y = 2/(x − 1) không?', diff: 'EASY' },
  { n: '1.18', text: 'Tìm các tiệm cận của đồ thị các hàm số sau: a) y = (3 − x)/(2x + 1); b) y = (2x² + x − 1)/(x + 2).', diff: 'MEDIUM' },
  { n: '1.19', text: 'Một công ty sản xuất đồ gia dụng ước tính chi phí để sản xuất x (sản phẩm) là C(x) = 2x + 50 (triệu đồng). Khi ấy f(x) = C(x)/x là chi phí sản xuất trung bình cho mỗi sản phẩm. Tính chất "f(x) giảm và lim[x→+∞] f(x) = 2" nói lên điều gì?', diff: 'HARD' },
  { n: '1.20', text: 'Một mảnh vườn hình chữ nhật có diện tích bằng 144 m². Biết độ dài một cạnh của mảnh vườn là x (m). a) Viết biểu thức tính chu vi P(x) (mét) của mảnh vườn. b) Tìm các tiệm cận của đồ thị hàm số P(x).', diff: 'MEDIUM' },
];

const BAI4: Q[] = [
  { n: '1.21', text: 'Khảo sát sự biến thiên và vẽ đồ thị của các hàm số sau: a) y = −x² + 3x + 1; b) y = x³ + 3x² − x − 1.', diff: 'EASY' },
  { n: '1.22', text: 'Khảo sát sự biến thiên và vẽ đồ thị của các hàm số sau: a) y = (2x + 1)/(x + 1); b) y = (x + 3)/(1 − x).', diff: 'MEDIUM' },
  { n: '1.23', text: 'Khảo sát sự biến thiên và vẽ đồ thị của các hàm số sau: a) y = (2x² − x + 4)/(x − 1); b) y = (x² + 2x + 1)/(x + 3).', diff: 'HARD' },
  { n: '1.24', text: 'Một cốc chứa 30 ml dung dịch KOH (potassium hydroxide) với nồng độ 100 mg/ml. Một bình chứa dung dịch KOH khác với nồng độ 8 mg/ml được trộn vào cốc. a) Tính nồng độ KOH trong cốc sau khi trộn x (ml) từ bình chứa, kí hiệu là C(x). b) Coi C(x) là hàm số xác định với x ≥ 0. Khảo sát sự biến thiên và vẽ đồ thị của hàm số này. c) Giải thích tại sao nồng độ KOH trong cốc giảm theo x nhưng luôn lớn hơn 8 mg/ml.', diff: 'HARD' },
  { n: '1.25', text: 'Trong Vật lí, ta biết rằng khi mắc song song hai điện trở R₁ và R₂ thì điện trở tương đương R của mạch điện được tính theo công thức R = R₁R₂/(R₁ + R₂). Giả sử R₁ = 8 Ω và điện trở kia được kí hiệu là x (Ω) thì điện trở tương đương R là hàm số của x. Vẽ đồ thị của hàm số y = R(x), x > 0 và dựa vào đồ thị đã vẽ, hãy cho biết: a) Điện trở tương đương của mạch thay đổi thế nào khi x tăng. b) Tại sao điện trở tương đương của mạch không bao giờ vượt quá 8 Ω.', diff: 'HARD' },
];

const BAI5: Q[] = [
  { n: '1.26', text: 'Giả sử một hạt chuyển động trên một trục thẳng đứng chiều dương hướng lên trên sao cho tọa độ của hạt (đơn vị: mét) tại thời điểm t (giây) là y = t³ − 12t + 3, t ≥ 0. a) Tìm các hàm vận tốc và gia tốc. b) Khi nào thì hạt chuyển động lên trên và khi nào thì hạt chuyển động xuống dưới? c) Tìm quãng đường hạt đi được trong khoảng thời gian 0 ≤ t ≤ 3. d) Khi nào hạt tăng tốc? Khi nào hạt giảm tốc?', diff: 'HARD' },
  { n: '1.27', text: 'Giả sử chi phí (tính bằng trăm nghìn đồng) để sản xuất x đơn vị hàng hóa nào đó là: C(x) = 23 000 + 50x − 0,5x² + 0,00175x³. a) Tìm hàm chi phí biên. b) Tìm C′(100) và giải thích ý nghĩa của nó.', diff: 'MEDIUM' },
  { n: '1.28', text: 'Người quản lí của một khu chung cư có 100 căn hộ cho thuê nhận thấy rằng tất cả các căn hộ sẽ có người thuê nếu giá thuê một căn hộ là 8 triệu đồng một tháng. Một cuộc khảo sát thị trường cho thấy rằng, trung bình cứ mỗi lần tăng giá thuê căn hộ thêm 100 nghìn đồng thì sẽ có thêm một căn hộ bị bỏ trống. Người quản lí nên đặt giá thuê mỗi căn hộ là bao nhiêu để doanh thu là lớn nhất?', diff: 'HARD' },
  { n: '1.29', text: 'Giả sử hàm cầu đối với một loại hàng hóa được cho bởi công thức p = 1000/x − 4, trong đó p là giá bán (nghìn đồng) của mỗi đơn vị sản phẩm và x là số lượng đơn vị sản phẩm đã bán. a) Tìm công thức tính x như là hàm số của p. Tìm tập xác định của hàm số này. Tính số đơn vị sản phẩm đã bán khi giá bán của mỗi đơn vị sản phẩm là 240 nghìn đồng. b) Khảo sát sự biến thiên và vẽ đồ thị của hàm số x = x(p). Từ đồ thị đã vẽ, hãy cho biết ý nghĩa thực tiễn của giới hạn lim[p→0⁺] x(p).', diff: 'HARD' },
];

// Trắc nghiệm (A–D) + tự luận cuối chương
const CUOI_CHUONG: Q[] = [
  {
    n: '1.30', text: 'Cho hàm số y = f(x) có đạo hàm trên khoảng (a; b). Phát biểu nào dưới đây là đúng?', diff: 'EASY',
    options: [
      { text: 'Nếu f(x) ≥ 0 với mọi x thuộc (a; b) thì hàm số y = f(x) đồng biến trên (a; b).' },
      { text: 'Nếu f′(x) > 0 với mọi x thuộc (a; b) thì hàm số y = f(x) đồng biến trên (a; b).', correct: true },
      { text: 'Hàm số y = f(x) đồng biến trên (a; b) khi và chỉ khi f′(x) ≥ 0 với mọi x thuộc (a; b).' },
      { text: 'Hàm số y = f(x) đồng biến trên (a; b) khi và chỉ khi f′(x) > 0 với mọi x thuộc (a; b).' },
    ],
  },
  {
    n: '1.31', text: 'Hàm số nào sau đây nghịch biến trên ℝ?', diff: 'MEDIUM',
    options: [
      { text: 'y = −x³ + 3x² − 9x.', correct: true },
      { text: 'y = −x³ + x + 1.' },
      { text: 'y = (x − 1)/(x − 2).' },
      { text: 'y = 2x² + 3x + 2.' },
    ],
  },
  {
    n: '1.32', text: 'Hàm số nào dưới đây không có cực trị?', diff: 'MEDIUM',
    options: [
      { text: 'y = |x|.' },
      { text: 'y = x³.' },
      { text: 'y = −x² + x.' },
      { text: 'y = (2x − 1)/(x + 1).', correct: true },
    ],
  },
  {
    n: '1.33', text: 'Giá trị cực tiểu của hàm số y = x² ln x là:', diff: 'HARD',
    options: [
      { text: '0' },
      { text: '1/(2e)' },
      { text: '−1/(2e)', correct: true },
      { text: 'e' },
    ],
  },
  {
    n: '1.35', text: 'Cho hàm số y = f(x) thỏa mãn: lim[x→2⁻] f(x) = 1; lim[x→2⁺] f(x) = 1; lim[x→+∞] f(x) = 2 và lim[x→−∞] f(x) = 2. Khẳng định nào sau đây là đúng?', diff: 'MEDIUM',
    options: [
      { text: 'Đường thẳng x = 2 là tiệm cận đứng của đồ thị hàm số.' },
      { text: 'Đường thẳng y = 2 là tiệm cận ngang của đồ thị hàm số.', correct: true },
      { text: 'Đường thẳng y = 1 là tiệm cận ngang của đồ thị hàm số.' },
      { text: 'Đường thẳng x = 2 là tiệm cận ngang của đồ thị hàm số.' },
    ],
  },
  {
    n: '1.36', text: 'Tiệm cận xiên của đồ thị hàm số y = x + 2/(x + 1) là:', diff: 'MEDIUM',
    options: [
      { text: 'y = −2' },
      { text: 'y = 1' },
      { text: 'y = x + 2' },
      { text: 'y = x', correct: true },
    ],
  },
  {
    n: '1.38', text: 'Đồ thị trong Hình 1.37 là đồ thị của hàm số:', diff: 'MEDIUM',
    options: [
      { text: 'y = (x + 2)/(x + 1)', correct: true },
      { text: 'y = (2x + 1)/(x + 1)' },
      { text: 'y = (x − 1)/(x + 1)' },
      { text: 'y = (x + 3)/(1 − x)' },
    ],
  },
  {
    n: '1.39', text: 'Đồ thị trong Hình 1.38 là đồ thị của hàm số:', diff: 'MEDIUM',
    options: [
      { text: 'y = x − (2x + 1)/(x + 1)' },
      { text: 'y = (x² − x + 1)/(x + 1)' },
      { text: 'y = (x² + x + 1)/(x + 1)', correct: true },
      { text: 'y = (x² − x + 1)/(x − 1)' },
    ],
  },
  { n: '1.40', text: 'Xét chiều biến thiên và tìm các cực trị (nếu có) của các hàm số sau: a) y = x³ − 3x² + 3x − 1; b) y = x⁴ − 2x² − 1; c) y = (2x − 1)/(3x + 1); d) y = (x² + 2x + 2)/(x + 1).', diff: 'MEDIUM' },
  { n: '1.41', text: 'Tìm giá trị lớn nhất và giá trị nhỏ nhất (nếu có) của các hàm số sau: a) y = (2x + 1)/(3x − 2) trên nửa khoảng [2; +∞); b) y = √(2 − x²).', diff: 'MEDIUM' },
  { n: '1.42', text: 'Tìm các tiệm cận của mỗi đồ thị hàm số sau: a) y = (3x − 2)/(x + 1); b) y = (x² + 2x − 1)/(2x − 1).', diff: 'MEDIUM' },
  { n: '1.43', text: 'Khảo sát sự biến thiên và vẽ đồ thị của các hàm số sau: a) y = −x³ + 6x² − 9x + 12; b) y = (2x − 1)/(x + 1); c) y = (x² − 2x)/(x − 1).', diff: 'HARD' },
  { n: '1.44', text: 'Xét một thấu kính hội tụ có tiêu cự f (H.1.39). Khoảng cách p từ vật đến thấu kính liên hệ với khoảng cách q từ ảnh đến thấu kính bởi hệ thức 1/p + 1/q = 1/f. a) Viết công thức tính q = g(p) như một hàm số của biến p ∈ (f; +∞). b) Tính các giới hạn lim[p→+∞] g(p), lim[p→f⁺] g(p) và giải thích ý nghĩa của các kết quả này. c) Lập bảng biến thiên của hàm số q = g(p) trên khoảng (f; +∞).', diff: 'HARD' },
  { n: '1.45', text: 'Dân số của một quốc gia sau t (năm) kể từ năm 2023 được ước tính bởi công thức: N(t) = 100e^(0,012t) (N(t) được tính bằng triệu người, 0 ≤ t ≤ 50). a) Ước tính dân số của quốc gia này vào các năm 2030 và 2035 (kết quả tính bằng triệu người, làm tròn kết quả đến chữ số thập phân thứ ba). b) Xem N(t) là hàm số của biến số t xác định trên đoạn [0; 50]. Xét chiều biến thiên của hàm số N(t) trên đoạn [0; 50]. c) Đạo hàm của hàm số N(t) biểu thị tốc độ tăng dân số của quốc gia đó (tính bằng triệu người/năm). Vào năm nào tốc độ tăng dân số đạt 1,6 triệu người/năm?', diff: 'HARD' },
  { n: '1.46', text: 'Một đường dây điện được nối từ một nhà máy điện A đến một hòn đảo C như Hình 1.40. Khoảng cách từ C đến B là 4 km, bờ biển AB dài 10 km. Tổng chi phí lắp đặt cho 1 km dây điện trên biển là 50 triệu đồng, còn trên đất liền là 30 triệu đồng. Xác định vị trí điểm M trên đoạn AB (điểm nối dây từ đất liền ra đảo) để tổng chi phí lắp đặt là nhỏ nhất.', diff: 'HARD' },
];

const LESSONS: { title: string; note: string; qs: Q[] }[] = [
  { title: 'Bài 1: Tính đơn điệu và cực trị của hàm số', note: '9 câu — đồng biến/nghịch biến, cực trị, bài toán thực tế.', qs: BAI1 },
  { title: 'Bài 2: Giá trị lớn nhất và giá trị nhỏ nhất của hàm số', note: '6 câu — GTLN/GTNN trên khoảng và đoạn, tối ưu thực tế.', qs: BAI2 },
  { title: 'Bài 3: Đường tiệm cận của đồ thị hàm số', note: '5 câu — tiệm cận đứng/ngang/xiên, ý nghĩa thực tế.', qs: BAI3 },
  { title: 'Bài 4: Khảo sát sự biến thiên và vẽ đồ thị của hàm số', note: '5 câu — khảo sát và vẽ đồ thị, bài toán liên môn.', qs: BAI4 },
  { title: 'Bài 5: Ứng dụng đạo hàm để giải quyết một số vấn đề liên quan đến thực tiễn', note: '4 câu — chuyển động, chi phí biên, tối ưu doanh thu, hàm cầu.', qs: BAI5 },
  { title: 'Bài tập cuối chương I', note: '15 câu — trắc nghiệm A–D (1.30–1.39) và tự luận (1.40–1.46).', qs: CUOI_CHUONG },
];

async function main() {
  // Giáo viên sở hữu đề cương + câu hỏi — yêu cầu đã chạy seed.ts gốc trước.
  const teacher = await prisma.user.findUnique({ where: { email: 'teacher@educonnect.local' } });
  if (!teacher) throw new Error('Chưa có teacher@educonnect.local — chạy `npx ts-node prisma/seed.ts` trước.');

  // 1) Ngân hàng câu hỏi — id q12c1-<số câu>, vd q12c1-01 cho Câu 1.1
  const qid = (n: string) => `q12c1-${n.split('.')[1].padStart(2, '0')}`;
  let qCount = 0;
  for (const les of LESSONS) {
    for (const q of les.qs) {
      const id = qid(q.n);
      await prisma.question.upsert({
        where: { id },
        update: { questionText: q.text, difficulty: q.diff ?? 'MEDIUM' },
        create: {
          id,
          teacherId: teacher.id,
          subject: 'Toán - Ứng dụng đạo hàm',
          type: q.options ? 'SINGLE' : 'FILL_BLANK',
          questionText: `[Câu ${q.n}] ${q.text}`,
          difficulty: q.diff ?? 'MEDIUM',
          defaultScore: 1.0,
          options: q.options
            ? { create: q.options.map((o, i) => ({ optionText: o.text, isCorrect: !!o.correct, orderIndex: i })) }
            : undefined,
        },
      });
      qCount++;
    }
  }
  console.log(`Upserted ${qCount} questions`);

  // 2) Đề cương + chương + bài + liên kết câu hỏi
  const curriculum = await prisma.curriculum.upsert({
    where: { id: 'curr-toan12-c1' },
    update: { title: 'Toán 12 - Ôn tập chương 1' },
    create: {
      id: 'curr-toan12-c1',
      teacherId: teacher.id,
      title: 'Toán 12 - Ôn tập chương 1',
      subject: 'Toán',
      status: 'PUBLISHED',
    },
  });

  const chapter = await prisma.chapter.upsert({
    where: { id: 'chap-toan12-c1-1' },
    update: { title: 'Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số' },
    create: {
      id: 'chap-toan12-c1-1',
      curriculumId: curriculum.id,
      title: 'Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
      orderIndex: 0,
    },
  });

  for (const [li, les] of LESSONS.entries()) {
    const lesson = await prisma.lesson.upsert({
      where: { id: `les-toan12-c1-b${li + 1}` },
      update: { title: les.title, contentNote: les.note },
      create: {
        id: `les-toan12-c1-b${li + 1}`,
        chapterId: chapter.id,
        title: les.title,
        orderIndex: li,
        contentNote: les.note,
      },
    });
    for (const [qi, q] of les.qs.entries()) {
      await prisma.lessonQuestion.upsert({
        where: { lessonId_questionId: { lessonId: lesson.id, questionId: qid(q.n) } },
        update: { orderIndex: qi },
        create: { lessonId: lesson.id, questionId: qid(q.n), orderIndex: qi },
      });
    }
  }
  console.log(`Seeded curriculum "${curriculum.title}": 1 chương, ${LESSONS.length} bài, ${qCount} câu hỏi`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
