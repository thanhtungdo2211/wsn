# Speaker Notes (tiếng Việt) – WSN Paper Summary

*Paper:* M. Trigka & E. Dritsas, “Wireless Sensor Networks: From Fundamentals and Applications to Innovations and Future Trends,” *IEEE Access*, vol. 13, 2025.  
*Slide:* `slides/WSN_Presentation.pptx` – 14 slide, khoảng 13 phút + phần hỏi đáp.  
*Ghi chú:* nội dung slide bằng tiếng Anh; notes dưới đây cũng được gắn sẵn vào file PowerPoint (Presenter View).

| # | Slide | Thời lượng |
|---|---|---|
| 1 | Title | 0.5 phút |
| 2 | Outline | 0.5 phút |
| 3 | The Paper at a Glance | 1 phút |
| 4 | Why This Survey? | 1 phút |
| 5 | WSN Architectures | 1 phút |
| 6 | A Unified Energy-Modelling Thread | 1.25 phút |
| 7 | Communication Protocols: MAC & Routing | 1.25 phút |
| 8 | Applications: 12 Domains in Practice | 1 phút |
| 9 | Innovations: Three Pillars | 1 phút |
| 10 | Challenges & Future Directions | 1 phút |
| 11 | Critical Assessment | 1.25 phút |
| 12 | Does Clustering Always Save Energy? | 1.5 phút |
| 13 | Conclusion | 0.75 phút |
| 14 | Thank You / Q&A | 0.25 phút |

## Slide 1 – Title *(~0.5 phút)*

Xin chào thầy/cô và các bạn. Em là Đỗ Thanh Tùng. Hôm nay em xin trình bày phần tóm tắt bài survey "Wireless Sensor Networks: From Fundamentals and Applications to Innovations and Future Trends" của hai tác giả Maria Trigka và Elias Dritsas, đăng trên IEEE Access năm 2025. Em chọn bài này vì nó bao quát gần như toàn bộ lĩnh vực WSN: từ những kiến thức nền tảng mà chúng ta đã học trong môn, cho tới các hướng nghiên cứu mới nhất.

## Slide 2 – Outline *(~0.5 phút)*

Bài trình bày gồm sáu phần. Đầu tiên là tổng quan về paper và lý do tác giả viết nó. Tiếp theo là phần nền tảng kỹ thuật: các kiến trúc mạng, mô hình năng lượng và các giao thức MAC, routing. Sau đó là ứng dụng và các đổi mới công nghệ, rồi đến những thách thức còn mở và hướng phát triển. Sau phần tóm tắt, em sẽ đưa ra đánh giá phản biện của riêng mình, kèm một ví dụ tính toán nhỏ để kiểm chứng một nhận định của paper. Cuối cùng là phần kết luận.

## Slide 3 – The Paper at a Glance *(~1 phút)*

Đây là một survey có phạm vi rất rộng: 35 trang, 355 tài liệu tham khảo, 10 bảng so sánh và 12 lĩnh vực ứng dụng. Hai tác giả đến từ University of West Attica, Hy Lạp. Paper có cấu trúc năm phần rất rõ ràng như trên slide: nền tảng ở Section II, ứng dụng ở Section III, đổi mới công nghệ ở Section IV, thách thức ở Section V và xu hướng tương lai ở Section VI. Mục tiêu tác giả đặt ra là kết nối các kiến thức WSN kinh điển với những chủ đề mới như federated learning, blockchain trust, quantum sensing và digital twin.

## Slide 4 – Why This Survey? *(~1 phút)*

Vì sao lại cần thêm một survey nữa? Tác giả chỉ ra ba động lực. Thứ nhất, năng lượng vẫn là ràng buộc lớn nhất: node chạy bằng pin có dung lượng hữu hạn, còn energy harvesting thì phụ thuộc vào môi trường như ánh sáng, nhiệt hay rung động. Thứ hai, WSN thường được triển khai ở môi trường khắc nghiệt và thiếu an toàn, nên phải vừa tin cậy vừa bảo mật trong khi năng lực tính toán rất hạn chế. Thứ ba, WSN giờ là một phần của hệ sinh thái IoT và AI, kéo theo yêu cầu cao hơn về xử lý, khả năng tương thích và bảo vệ dữ liệu riêng tư. So với các survey trước, vốn thường chỉ tập trung vào một chủ đề như routing hay clustering, bài này cố gắng nối phần nền tảng với các xu hướng liên ngành và với những môi trường ít được nghiên cứu như dưới nước hay ngoài không gian.

## Slide 5 – WSN Architectures *(~1 phút)*

Paper phân loại kiến trúc mạng theo ba chiều: số tầng, vị trí đặt quyền điều khiển, và việc node có ngủ theo chu kỳ hay không. Mạng phẳng một tầng thì đơn giản, nhưng các node gần sink phải chuyển tiếp dữ liệu cho cả mạng nên hết pin trước. Mạng nhiều tầng hay phân cụm thì mở rộng tốt hơn, nhưng cluster head phải gánh tải nặng hơn. Kiến trúc tập trung có cái nhìn toàn cục nhưng có điểm lỗi duy nhất, còn kiến trúc phân tán dùng thuật toán đồng thuận (consensus) nên bền vững nhất. Duty cycling là một chiều độc lập: node ngủ phần lớn thời gian, với duty cycle D bằng thời gian hoạt động chia cho độ dài một chu kỳ. Một nhận xét hay của tác giả là kiến trúc phân cụm và kiến trúc nhiều tầng thực chất có cùng cấu trúc, nên có thể dùng chung một mô hình năng lượng.

## Slide 6 – A Unified Energy-Modelling Thread *(~1.25 phút)*

Điểm đặc trưng của paper là gắn một biểu thức năng lượng cho mọi kiến trúc và mọi họ giao thức. Với mạng tập trung một bước nhảy, tổng năng lượng chỉ là năng lượng cảm biến cộng năng lượng truyền thẳng về sink của từng node. Với mạng phân cụm, đó là năng lượng cục bộ của các node thành viên cộng với năng lượng của các cluster head. Với mạng duty-cycled, đó là trung bình có trọng số giữa công suất lúc hoạt động và lúc ngủ. Cách làm này được lặp lại cho các giao thức: mỗi lớp MAC cộng thêm các số hạng thời gian nhân công suất như listen, collision hay preamble; còn routing thì cộng năng lượng truyền và nhận qua từng hop của đường đi, cộng thêm một số hạng cho error control hoặc mã hóa. Tuy nhiên, đây chỉ là các đẳng thức "kế toán": chúng cho biết cần cộng những gì, nhưng bên trong không có mô hình khoảng cách, kênh truyền hay va chạm. Em sẽ quay lại điểm này ở ví dụ tính toán.

## Slide 7 – Communication Protocols: MAC & Routing *(~1.25 phút)*

Về MAC, paper chia thành bốn lớp. Lớp contention-free như TDMA và TSCH tránh được va chạm nhưng cần đồng bộ thời gian chặt chẽ. Lớp contention-based như CSMA/CA, S-MAC, B-MAC, X-MAC thì đơn giản, nhưng khi mạng dày đặc thì idle listening và collision tăng mạnh; cơ chế RTS/CTS giúp giảm bớt. Lớp hybrid như Z-MAC chuyển từ CSMA sang TDMA khi tranh chấp kênh tăng lên, còn các giao thức adaptive mới dùng reinforcement learning để tự học cách truy cập kênh. Về routing có sáu họ: data-centric như Directed Diffusion; hierarchical như LEACH, PEGASIS, HEED; location-based như GPSR; multipath; QoS-aware; và security-oriented. Mỗi họ được paper tóm tắt cơ chế hoạt động và mô hình năng lượng tương ứng.

## Slide 8 – Applications: 12 Domains in Practice *(~1 phút)*

Section III bao quát mười hai lĩnh vực ứng dụng. Điểm chung là mỗi ứng dụng kết hợp ba thứ: một loại cảm biến, một phương pháp xử lý tín hiệu hoặc machine learning, và một cơ chế mạng phù hợp. Ví dụ, giám sát môi trường dùng mạng RNN để dự báo vi khí hậu và Kalman filter để cảnh báo sạt lở; y tế dùng body sensor network với mô hình CNN, LSTM; công nghiệp dùng phân tích rung động qua chuẩn WirelessHART. Một điểm mạnh của paper là lĩnh vực nào cũng được gắn với một triển khai thực tế, như dự án Internet of Forests ở rừng Amazon hay dự án iMUGS của NATO.

## Slide 9 – Innovations: Three Pillars *(~1 phút)*

Phần đổi mới công nghệ có thể gom thành ba trụ cột. Về năng lượng: thu năng lượng mặt trời hiệu quả hơn nhờ MPPT, nguồn áp điện và nhiệt điện, thu năng lượng lai từ nhiều nguồn, và wake-up radio giúp loại bỏ idle listening. Về truyền thông: TSCH cho độ tin cậy trong công nghiệp, liên kết lai âm thanh – quang học dưới nước, và 6LoWPAN, RPL để tích hợp IPv6. Về trí tuệ và bảo mật: mô hình TinyML chạy trên vi điều khiển, federated learning và fog computing, cùng mã hóa nhẹ, blockchain và hệ thống phát hiện xâm nhập dùng machine learning. Paper cũng bàn về software-defined WSN, linh hoạt nhưng vẫn còn tốn chi phí điều khiển, và phần cứng mới như radio LoRa hay smart sensor.

## Slide 10 – Challenges & Future Directions *(~1 phút)*

Tác giả liệt kê chín thách thức và lưu ý rằng phần lớn chúng đã được biết đến từ những ngày đầu của WSN: năng lượng, khả năng mở rộng và tắc nghẽn, nhiễu, bảo mật, quyền riêng tư, quá tải dữ liệu, chuẩn hóa, độ trễ và chi phí. Khi đọc gộp lại, em thấy một mâu thuẫn lặp đi lặp lại: gần như mọi giải pháp được đề xuất, như clustering bằng ML, blockchain hay federated learning, đều cần năng lực tính toán và bộ nhớ mà node cảm biến không có. Về hướng tương lai, điểm hay là mỗi xu hướng được gắn nhãn loại tiến bộ cần có. Một số là bài toán thuật toán ngắn hạn, như giao thức context-aware hay federated learning; số khác, như quantum sensing và phân phối khóa lượng tử QKD, là mục tiêu phần cứng dài hạn.

## Slide 11 – Critical Assessment *(~1.25 phút)*

Bây giờ là đánh giá của riêng em. Về điểm mạnh: paper có cấu trúc rõ ràng, có góc nhìn năng lượng thống nhất, lĩnh vực nào cũng có ví dụ triển khai thực tế, và tác giả khá trung thực về giới hạn của các công nghệ đang được thổi phồng, như module lượng tử, blockchain proof-of-work hay controller của SDWSN. Paper cũng cho một lộ trình nghiên cứu hữu ích. Về hạn chế: paper hoàn toàn không có đánh giá định lượng, không có mô phỏng hay số liệu đo để so sánh các giao thức. Các mô hình năng lượng quá trừu tượng để trả lời câu hỏi thiết kế. Phương pháp làm survey, tức là tìm trong cơ sở dữ liệu nào và tiêu chí chọn bài ra sao, không được nêu. Nhiều giao thức chỉ được mô tả trong một câu, và có một chỗ không nhất quán nhỏ trong cách phân loại MAC. Tóm lại: đây là một tấm bản đồ rất tốt của lĩnh vực, nhưng không phải nguồn số liệu để ra quyết định thiết kế.

## Slide 12 – Does Clustering Always Save Energy? *(~1.5 phút)*

Để kiểm chứng nhận định "phân cụm giúp tiết kiệm năng lượng", em áp dụng first-order radio model chuẩn trong các bài báo về LEACH vào hai công thức tập trung và phân cụm của paper. Thiết lập gồm 100 node, 5 cụm, gói tin 4000 bit, node thành viên cách cluster head 20 mét, và giả sử gộp dữ liệu hoàn hảo. Đây là tính toán của em, không có trong paper. Kết quả: khi sink ở gần, 30 mét, phân cụm lại tốn hơn 81 phần trăm, vì chi phí nhận và gộp dữ liệu ở cluster head lớn hơn phần tiết kiệm được. Khi sink ở xa, 100 mét, các đường truyền dài rơi vào vùng suy hao multipath tỉ lệ với d mũ 4, nên phân cụm tiết kiệm 37 phần trăm; ở 150 mét thì tiết kiệm tới 80 phần trăm. Ngoài ra, một cluster head tiêu thụ gấp khoảng 23 lần một node thành viên, nên bắt buộc phải luân phiên vai trò cluster head như LEACH hay HEED. Những điều này hoàn toàn không thấy được từ các công thức không có khoảng cách của paper. Ví dụ này cũng trả lời câu hỏi của môn học về mô hình many-to-one với hub node: hub chỉ giúp tiết kiệm năng lượng khi liên kết từ hub về sink đủ dài.

## Slide 13 – Conclusion *(~0.75 phút)*

Để kết luận: paper là một tấm bản đồ rộng và có cấu trúc tốt về lĩnh vực WSN, từ kiến trúc và giao thức cho tới TinyML, federated learning, blockchain và digital twin. Đóng góp nổi bật là các mô hình năng lượng thống nhất, các case study thực tế và cách phân loại xu hướng tương lai theo loại tiến bộ cần có. Hạn chế chính là thiếu bằng chứng định lượng; như ví dụ vừa rồi cho thấy, chỉ cần thêm một mô hình radio cụ thể là câu trả lời có thể thay đổi. Vì vậy em đề xuất dùng paper như một tấm bản đồ và điểm xuất phát cho các nghiên cứu mô phỏng, chứ không dùng làm nguồn số liệu thiết kế.

## Slide 14 – Thank You / Q&A *(~0.25 phút)*

Em xin cảm ơn thầy/cô và các bạn đã lắng nghe. Em rất sẵn lòng trả lời các câu hỏi.

## Câu hỏi có thể gặp

**Hỏi: Vì sao dùng first-order radio model?**  
Đáp: Đây là mô hình chuẩn trong các bài về LEACH (Heinzelman và cộng sự, 2000/2002) và là mô hình đơn giản nhất bổ sung được số hạng khoảng cách còn thiếu trong công thức của paper. Con số cụ thể phụ thuộc tham số, nhưng kết luận định tính – tồn tại một khoảng cách ngưỡng mà từ đó phân cụm mới có lợi – là vững.

**Hỏi: Paper nói gì về mạng dày đặc (dense deployment) và tranh chấp kênh?**  
Đáp: Chỉ ở mức định tính: mạng dày đặc thường dùng CSMA/CA, va chạm tăng theo mật độ, và các giải pháp chính là RTS/CTS, TSCH, Z-MAC hoặc phân cụm. Mô hình năng lượng của CSMA/CA có số hạng collision riêng, nhưng paper không đưa ra số liệu packet delivery ratio (PDR).

**Hỏi: Làm sao kiểm chứng ví dụ tính toán?**  
Đáp: Bằng mô phỏng (ví dụ NS-3 hoặc OMNeT++/Castalia): thay đổi mật độ node và khoảng cách tới sink, so sánh truyền thẳng với phân cụm LEACH/HEED, đo năng lượng mỗi vòng, thời gian sống của mạng và PDR. Mô phỏng sẽ tính cả va chạm ở tầng MAC, điều mà phép tính của em bỏ qua.

**Hỏi: Vì sao chọn paper này thay vì paper còn lại?**  
Đáp: Paper còn lại (Ojha & Gupta, 2025) chủ yếu là phân tích thư mục – đếm số bài báo và mốc thời gian. Paper này mang tính kỹ thuật hơn và bám sát nội dung môn học: kiến trúc, năng lượng, MAC và routing.
