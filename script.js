// 전역 변수
let currentCropper = null;
let currentTarget = null;

document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('.unselctbtn');
    
    // 토글 버튼 기능
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('selected');
        });
    });

    // 색상을 RGB로 변환하는 함수
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    // RGB를 HSL로 변환하는 함수
    function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    // HSL을 RGB로 변환하는 함수
    function hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    // 명도를 낮춘 색상 생성
    function darkenColor(hex, percent) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hsl.l = Math.max(0, hsl.l - percent);
        
        const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
        return `rgb(${newRgb.r}, ${newRgb.g}, ${newRgb.b})`;
    }

    // 배경색 변경 기능
    const bgColorPicker = document.getElementById('bg-color');
    const body = document.body;
        
    bgColorPicker.addEventListener('input', function() {
        const selectedColor = this.value;
        body.style.backgroundColor = selectedColor;
        
        // 명도를 60% 낮춘 색상으로 h3색상 변경
        const darkerColor60 = darkenColor(selectedColor, 40);
        
        // 명도를 40% 낮춘 색상으로 버튼과 닉네임과 그림자 색상 변경
        const darkerColor40 = darkenColor(selectedColor, 30);
        
        // 명도를 20% 낮춘 색상 (투명도 50%)
        const rgb20 = hexToRgb(darkenColor(selectedColor, 20));
        const darkerColor20Transparent = rgb20 ? `rgba(${rgb20.r}, ${rgb20.g}, ${rgb20.b}, 0.5)` : 'rgba(102, 102, 102, 0.5)';
        
        // h3에 적용
        document.querySelectorAll('h3').forEach(el => {
            el.style.color = darkerColor60;
        });
        
        // h2 그림자에 적용 (투명도 50%)
        document.documentElement.style.setProperty('--text-shadow-color-transparent', darkerColor20Transparent);
        
        // 닉네임 플레이스홀더에 적용 (투명도 50%)
        document.documentElement.style.setProperty('--placeholder-color', darkerColor20Transparent);
        
        // 버튼과 닉네임에 적용
        document.documentElement.style.setProperty('--unselect-text-color', darkerColor40);
        document.documentElement.style.setProperty('--unselect-border-color', darkerColor40);
        
        // 토글 버튼 선택 시 배경색 적용
        document.documentElement.style.setProperty('--selected-bg-color', selectedColor);
        document.documentElement.style.setProperty('--selected-border-color', selectedColor);
    });

    // 장르 추가 기능
    const addGenreBtn = document.getElementById('addgenre');
    const genreSection = document.querySelector('.genre-section');
    let genreCount = 1;

    addGenreBtn.addEventListener('click', function() {
        if (genreCount >= 9) {
            alert('최대 9개까지 추가할 수 있습니다.');
            return;
        }

        const newGenreImg = document.createElement('div');
        newGenreImg.className = 'genre-img';
        newGenreImg.innerHTML = `
            <div class="genre-info">
                <input type="text" class="genre-title" placeholder="제목" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                <input type="text" class="genre-content" placeholder="상세설명" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
            </div>
            <input type="file" class="genre-file-input" accept="image/*">
        `;
        
        genreSection.appendChild(newGenreImg);
        genreCount++;
    });

    // Cropper.js 라이브러리 로드 함수
    async function loadCropperJS() {
        if (!window.Cropper) {
            // CSS 로드
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css';
            document.head.appendChild(link);
            
            // JS 로드
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js';
            document.head.appendChild(script);
            
            await new Promise((resolve) => {
                script.onload = resolve;
            });
        }
    }

    // 이미지 크롭 모달 열기
    async function openCropModal(file, target) {
        await loadCropperJS();
        
        currentTarget = target;
        const modal = document.getElementById('cropModal');
        const preview = document.getElementById('cropPreview');
        
        // 기존 cropper 제거
        if (currentCropper) {
            currentCropper.destroy();
        }
        
        // 이미지 로드
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%;" id="cropImage">`;
            modal.classList.add('active');
            
            // Cropper 초기화
            const image = document.getElementById('cropImage');
            const isProfile = target.closest('.profile-img') !== null;
            
            currentCropper = new Cropper(image, {
                aspectRatio: isProfile ? 1 : NaN, // 프로필은 1:1, 장르는 자유
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
            });
        };
        reader.readAsDataURL(file);
    }

    // 크롭 완료
    document.getElementById('cropConfirm').addEventListener('click', function() {
        if (currentCropper && currentTarget) {
            const canvas = currentCropper.getCroppedCanvas();
            const imgData = canvas.toDataURL();
            
            const targetDiv = currentTarget.closest('.profile-img, .genre-img');
            targetDiv.style.backgroundImage = `url(${imgData})`;
            targetDiv.style.backgroundSize = 'cover';
            targetDiv.style.backgroundPosition = 'center';
            
            closeCropModal();
        }
    });

    // 크롭 취소
    document.getElementById('cropCancel').addEventListener('click', closeCropModal);

    function closeCropModal() {
        const modal = document.getElementById('cropModal');
        modal.classList.remove('active');
        if (currentCropper) {
            currentCropper.destroy();
            currentCropper = null;
        }
        currentTarget = null;
    }

    // 프로필 이미지 업로드
    const profileImgInput = document.getElementById('profile-img');
    profileImgInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            openCropModal(e.target.files[0], e.target);
        }
    });

    // 장르 이미지 업로드 (동적으로 추가된 것들도 포함)
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('genre-file-input')) {
            if (e.target.files && e.target.files[0]) {
                openCropModal(e.target.files[0], e.target);
            }
        }
    });

    // 이미지로 저장 기능
    const saveBtn = document.getElementById('savebtn');
    saveBtn.addEventListener('click', async function() {
        // html2canvas 라이브러리 동적 로드
        if (!window.html2canvas) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            document.head.appendChild(script);
            
            await new Promise((resolve) => {
                script.onload = resolve;
            });
        }

        // control 숨김
        const control = document.querySelector('.control');
        control.style.display = 'none';
        
        try {
            const canvas = await html2canvas(document.body, {
                backgroundColor: window.getComputedStyle(document.body).backgroundColor,
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: false,
                imageTimeout: 0,
                onclone: (clonedDoc) => {
                    // 클론된 문서의 모든 input 요소에 line-height 강제 적용
                    const inputs = clonedDoc.querySelectorAll('input[type="text"]');
                    inputs.forEach(input => {
                        input.style.lineHeight = '1.5';
                        input.style.padding = '8px 12px';
                        input.style.height = 'auto';
                    });
                }
            });
            
            // 이미지로 변환하여 다운로드
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = '성향표_' + new Date().getTime() + '.png';
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            });
        } catch (error) {
            console.error('이미지 저장 중 오류:', error);
            alert('이미지 저장 중 오류가 발생했습니다.');
        } finally {
            // control 다시 표시
            control.style.display = 'flex';
        }
    });
});