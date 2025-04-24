document.addEventListener('DOMContentLoaded', () => {
    const swiper = new Swiper('.swiper-container', {
        slidesPerView: 1, // Chỉ hiển thị 1 slide tại một thời điểm
        spaceBetween: 0,  // Không có khoảng cách giữa các slide
        loop: true,
        speed: 1000, // Tốc độ chuyển slide (1000ms = 1 giây, làm chậm hơn)
        autoplay: {
            delay: 7000, // Tăng thời gian delay lên 5 giây
            disableOnInteraction: false,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
    });

    const popupOverlay = document.getElementById('popup-overlay');
    const closePopup = document.getElementById('close-popup');

    // Hiển thị popup
    popupOverlay.style.display = 'flex';

    // Đóng popup khi nhấn nút "X"
    closePopup.addEventListener('click', () => {
        popupOverlay.style.display = 'none';
    });

    // Đóng popup khi nhấn vào lớp phủ
    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
            popupOverlay.style.display = 'none';
        }
    });

    // Hiển thị thanh quảng cáo dọc trên màn hình lớn
    const adLeft = document.getElementById('ad-left');
    const adRight = document.getElementById('ad-right');

    function toggleAdBanners() {
        if (window.innerWidth >= 1200) { // Chỉ hiển thị trên màn hình lớn (>= 1200px)
            adLeft.style.display = 'block';
            adRight.style.display = 'block';
        } else {
            adLeft.style.display = 'none';
            adRight.style.display = 'none';
        }
    }

    // Gọi hàm khi trang được tải và khi thay đổi kích thước cửa sổ
    toggleAdBanners();
    window.addEventListener('resize', toggleAdBanners);
});