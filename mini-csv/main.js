// document.getElementById('f').addEventListener('change', async (e) => {
//   const file = e.target.files[0];
//   if (!file) return;
//   await uploadFile(file);
// });

// 让点击整个拖拽区域都能打开文件选择框
// 1. 普通点击上传
document.getElementById('dropZone').addEventListener('click', () => document.getElementById('f').click());


// 2. 拖拽上传
const dropZone = document.getElementById('dropZone');

['dragover', 'dragleave', 'drop'].forEach(evt => {
  dropZone.addEventListener(evt, e => {
    e.preventDefault();
    dropZone.classList.toggle('drag-over', evt === 'dragover');
  });
});

dropZone.addEventListener('drop', async (e) => {
  const file = e.dataTransfer.files[0];
  if (file && file.name.toLowerCase().endsWith('.csv')) {
    await uploadFile(file);
  } else {
    alert('请拖入 .csv 文件');
  }
});

// 3. 公共上传函数
async function uploadFile(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('./upload', { method: 'POST', body: form });
  document.getElementById('out').textContent = await res.text();
}

// 4. 心跳（保持后台存活）
setInterval(() => fetch('./ping', { method: 'POST', keepalive: true }), 3000);


