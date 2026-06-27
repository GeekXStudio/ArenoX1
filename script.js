
// ============================================================
// script.js – ArenoX Tournament (نسخة محسّنة مع تحقق أفضل)
// ============================================================

// 🔴 تأكد من أن هذا الرابط صحيح تماماً (ينتهي بـ /exec)
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyce85f_Rv1jOKR642WEnnaqQLcghczi_GDJTRWkyHkPKHEXAijZnfyJkUgH53vnbmp/exec';

// ---------- عناصر DOM ----------
const form = document.getElementById('result-form');
const submitBtn = document.getElementById('submit-btn');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const formMessage = document.getElementById('form-message');

const fileInput = document.getElementById('screenshot');
const fileDrop = document.getElementById('file-drop');
const previewContainer = document.getElementById('image-preview-container');
const previewImg = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image');
const fileNameDisplay = document.getElementById('file-name-display');

const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const modalClose = document.getElementById('modal-close');
const modalOverlay = document.getElementById('modal-overlay');

let selectedFile = null;
let compressedFile = null;
let isSubmitting = false;

// ============================================================
// ربط منطقة الإسقاط
// ============================================================
fileDrop.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
        previewImg.src = ev.target.result;
        previewContainer.style.display = 'inline-block';
        fileNameDisplay.textContent = file.name;
    };
    reader.readAsDataURL(file);
});

removeImageBtn.addEventListener('click', () => {
    fileInput.value = '';
    previewContainer.style.display = 'none';
    previewImg.src = '';
    selectedFile = null;
    compressedFile = null;
    fileNameDisplay.textContent = '';
});

previewImg.addEventListener('click', () => {
    if (previewImg.src) openModal(previewImg.src);
});

// ============================================================
// إرسال النموذج مع تحسينات
// ============================================================
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // جمع البيانات
    const player = document.getElementById('player-name').value.trim();
    const opponent = document.getElementById('opponent-name').value.trim();
    const matchId = document.getElementById('match-id').value.trim();
    const stage = document.getElementById('stage').value;
    const result = document.getElementById('result').value.trim();
    const notes = document.getElementById('notes').value.trim();

    // التحقق
    if (!player || !opponent || !matchId || !stage || !result) {
        showMessage('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    if (!selectedFile) {
        showMessage('الرجاء اختيار لقطة شاشة', 'error');
        return;
    }

    isSubmitting = true;
    submitBtn.disabled = true;
    progressBar.style.display = 'flex';
    updateProgress(0);

    try {
        // 1. ضغط الصورة
        updateProgress(10);
        const compressed = await compressImage(selectedFile);
        compressedFile = compressed;
        updateProgress(40);

        // 2. تحويل إلى Base64
        const base64 = await fileToBase64(compressedFile);
        updateProgress(60);

        // 3. تحضير البيانات
        const payload = {
            player,
            opponent,
            matchId,
            stage,
            result,
            notes,
            screenshot: base64,
            filename: compressedFile.name || selectedFile.name
        };

        // 4. إرسال البيانات (مع إمكانية قراءة الرد)
        updateProgress(80);
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',  // لا يسمح بقراءة الرد، لكنه يرسل البيانات
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // ملاحظة: بسبب no-cors، لا يمكننا قراءة response.text()
        // لكننا نفترض النجاح إذا لم يرمي استثناء

        updateProgress(100);
        await new Promise(resolve => setTimeout(resolve, 1500));

        // إعادة تعيين النموذج
        form.reset();
        previewContainer.style.display = 'none';
        previewImg.src = '';
        selectedFile = null;
        compressedFile = null;
        fileNameDisplay.textContent = '';
        showMessage('✅ تم تسجيل النتيجة بنجاح! سيتم مراجعتها قريباً.', 'success');

    } catch (err) {
        console.error('❌ خطأ في الإرسال:', err);
        showMessage('❌ حدث خطأ أثناء الإرسال: ' + err.message, 'error');
    } finally {
        isSubmitting = false;
        submitBtn.disabled = false;
        progressBar.style.display = 'none';
        updateProgress(0);
    }
});

// ============================================================
// دوال مساعدة
// ============================================================
async function compressImage(file) {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg',
        quality: 0.8
    };
    try {
        return await imageCompression(file, options);
    } catch (error) {
        console.warn('⚠️ فشل الضغط، سيتم استخدام الملف الأصلي:', error);
        return file;
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function updateProgress(value) {
    progressFill.style.width = value + '%';
    progressText.textContent = value + '%';
}

function showMessage(text, type = 'success') {
    formMessage.style.display = 'flex';
    formMessage.className = 'form__message form__message--' + type;
    formMessage.innerHTML = text;
    clearTimeout(window._msgTimeout);
    window._msgTimeout = setTimeout(() => {
        formMessage.style.display = 'none';
    }, 6000);
}

// ============================================================
// مودال الصورة
// ============================================================
function openModal(url) {
    modalImage.src = url;
    imageModal.classList.add('open');
}

function closeModal() {
    imageModal.classList.remove('open');
    modalImage.src = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

console.log('🚀 ArenoX Tournament Ready');
console.log('📡 Web App URL:', WEB_APP_URL);