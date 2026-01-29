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

    function adjustColor(hex, lightnessChange, saturationChange) {
        const rgb = hexToRgb(hex);
        if (!rgb) return hex;
        
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hsl.l = Math.max(0, Math.min(100, hsl.l + lightnessChange));
        hsl.s = Math.max(0, Math.min(100, hsl.s + saturationChange));
        
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
        const darkerColor60 = adjustColor(selectedColor, -40, -20);
        
        // 명도를 40% 낮춘 색상으로 버튼과 닉네임과 그림자 색상 변경
        const darkerColor40 = adjustColor(selectedColor,  -20, -30);
        
        // h3에 적용
        document.querySelectorAll('h3').forEach(el => {
            el.style.color = darkerColor60;
        });

        // 명도를 높인 색상으로 이미지 배경색 변경
        const lighterColor = adjustColor(selectedColor, 10, -10); // 명도 30% 증가, 채도 10% 감소
        document.querySelectorAll('.profile-img, .genre-img').forEach(el => {
            el.style.backgroundColor = lighterColor;
        });
        
        // h2 그림자에 적용
        const shadowColor = adjustColor(selectedColor, -50, -30);
        document.documentElement.style.setProperty('--text-shadow-color', shadowColor)

        // 닉네임과 ECT 플레이스홀더에 적용 - 동적 스타일 태그로 적용
        const darkerColor20 = adjustColor(selectedColor, -20, -20);
        document.documentElement.style.setProperty('--placeholder-color', darkerColor20);
        
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


    // 장르 삭제 기능
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            e.target.closest('.genre-img').remove();
            genreCount--;
        }
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
        const card = document.querySelector('.card');
        control.style.display = 'none';
        
        try {
            // card에 50px 패딩 추가
            const wrapper = document.createElement('div');
            wrapper.style.padding = '50px';
            wrapper.style.backgroundColor = window.getComputedStyle(document.body).backgroundColor;
            wrapper.style.backgroundImage = window.getComputedStyle(document.body).backgroundImage;
            wrapper.style.backgroundSize = 'cover';
            wrapper.style.backgroundPosition = 'center';
            wrapper.style.display = 'inline-block';
            
            const cardClone = card.cloneNode(true);
            wrapper.appendChild(cardClone);
            document.body.appendChild(wrapper);
            
            const canvas = await html2canvas(wrapper, {
                backgroundColor: null,
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
                foreignObjectRendering: false,
                imageTimeout: 0,
                onclone: (clonedDoc) => {
                    // 모든 input과 textarea의 값을 div로 변환
                    const inputs = clonedDoc.querySelectorAll('input[type="text"], textarea');
                    inputs.forEach(input => {
                        // 값이 없으면 빈 div로 만들기 (placeholder 숨김)
                        if (!input.value) {
                            const div = clonedDoc.createElement('div');
                            div.style.display = 'none';
                            input.parentNode.replaceChild(div, input);
                            return;
                        }
                        
                        const div = clonedDoc.createElement('div');
                        div.textContent = input.value;
                        
                        // 원본 input의 계산된 스타일 가져오기
                        const computedStyle = window.getComputedStyle(input);
                        
                        // 중요한 스타일만 복사
                        div.style.fontSize = computedStyle.fontSize;
                        div.style.fontWeight = computedStyle.fontWeight;
                        div.style.fontFamily = computedStyle.fontFamily;
                        div.style.color = computedStyle.color;
                        div.style.padding = computedStyle.padding;
                        div.style.margin = computedStyle.margin;
                        div.style.lineHeight = computedStyle.lineHeight;
                        div.style.textAlign = computedStyle.textAlign;
                        div.style.border = computedStyle.border;
                        div.style.borderRadius = computedStyle.borderRadius;
                        div.style.backgroundColor = computedStyle.backgroundColor;
                        div.style.width = computedStyle.width;
                        div.style.overflow = 'visible';
                        div.style.whiteSpace = 'pre-wrap';
                        div.style.wordBreak = 'break-word';
                        
                        input.parentNode.replaceChild(div, input);
                    });
                }
            });
            
            // wrapper 제거
            document.body.removeChild(wrapper);
            
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

    // textarea 자동 높이 조절
    const textarea = document.getElementById('ECT');
    if (textarea) {
        // 초기 높이 설정
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
        
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
});
