const btn=document.querySelector(".menu-toggle");const nav=document.querySelector(".nav-links");btn?.addEventListener("click",()=>{const open=nav.classList.toggle("open");btn.setAttribute("aria-expanded",open)});document.querySelectorAll(".nav-links a").forEach(a=>a.addEventListener("click",()=>(nav.classList.remove("open"),btn?.setAttribute("aria-expanded","false"))));

const STORAGE_KEY="tbAnakCareMedicineLogs";

function getMedicineLogs(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch(e){ return []; }
}
function saveMedicineLogs(logs){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}
function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function formatDateID(dateStr){
  if(!dateStr) return "-";
  const [y,m,d]=dateStr.split("-");
  return `${d}/${m}/${y}`;
}
function renderMedicineLogs(){
  const logs=getMedicineLogs();
  const body=document.getElementById("medicineTableBody");
  if(!body) return;
  const filter=document.getElementById("medicineFilter")?.value || "Semua";
  const shown=filter==="Semua" ? logs : logs.filter(x=>x.status===filter);
  if(!shown.length){
    body.innerHTML='<tr class="empty-row"><td colspan="6">Belum ada catatan minum obat.</td></tr>';
  }else{
    body.innerHTML=shown.map(log=>{
      const cls=log.status==="Sudah diminum"?"status-done":(log.status==="Terlewat"?"status-missed":"status-wait");
      return `<tr>
        <td>${formatDateID(log.tanggal)}</td>
        <td>${escapeHTML(log.waktu || "-")}</td>
        <td>${escapeHTML(log.obat)}</td>
        <td><span class="status-pill ${cls}">${escapeHTML(log.status)}</span></td>
        <td>${escapeHTML(log.catatan || "-")}</td>
        <td><button class="icon-button" type="button" onclick="deleteMedicineLog(${logs.indexOf(log)})">Hapus</button></td>
      </tr>`;
    }).join("");
  }
  const done=logs.filter(x=>x.status==="Sudah diminum").length;
  document.getElementById("totalCatatan").textContent=logs.length;
  document.getElementById("sudahDiminum").textContent=done;
  document.getElementById("belumDiminum").textContent=logs.length-done;
  const percent=logs.length ? Math.round(done/logs.length*100) : 0;
  const donut=document.getElementById('progressDonut');
  if(donut) donut.style.setProperty('--progress',percent);
  const progress=document.getElementById('progressPercent');
  if(progress)progress.textContent=percent+'%';
  renderMedicineCalendar();
}
function addMedicineLog(){
  const obat=document.getElementById("obat").value.trim();
  const tanggal=document.getElementById("tanggal").value;
  const waktu=document.getElementById("waktu").value;
  const status=document.getElementById("status").value;
  const catatan=document.getElementById("catatan").value.trim();
  if(!obat || !tanggal){
    alert("Isi nama obat dan tanggal terlebih dahulu.");
    return;
  }
  const logs=getMedicineLogs();
  logs.unshift({obat,tanggal,waktu,status,catatan});
  saveMedicineLogs(logs);
  document.getElementById("obat").value="";
  document.getElementById("catatan").value="";
  renderMedicineLogs();
  document.getElementById("selectedDayLogs")?.scrollIntoView({block:"nearest",behavior:"smooth"});
}
function deleteMedicineLog(index){
  const logs=getMedicineLogs();
  logs.splice(index,1);
  saveMedicineLogs(logs);
  renderMedicineLogs();
}
function clearMedicineLogs(){
  const logs=getMedicineLogs();
  if(!logs.length) return;
  if(confirm("Hapus semua catatan minum obat?")){
    localStorage.removeItem(STORAGE_KEY);
    renderMedicineLogs();
  }
}
function exportMedicineCSV(){
  const logs=getMedicineLogs();
  if(!logs.length){ alert("Belum ada catatan untuk diunduh."); return; }
  const rows=[["Tanggal","Waktu","Nama Obat","Status","Catatan"], ...logs.map(x=>[x.tanggal,x.waktu,x.obat,x.status,x.catatan])];
  const csv=rows.map(r=>r.map(v=>`"${String(v ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="catatan-minum-obat-tb.csv";a.click();
  URL.revokeObjectURL(url);
}
document.addEventListener("DOMContentLoaded",()=>{
  const t=document.getElementById("tanggal");
  if(t && !t.value){
    const now=new Date(), local=new Date(now.getTime()-now.getTimezoneOffset()*60000);
    t.value=local.toISOString().slice(0,10);
  }
  document.getElementById('medicineFilter')?.addEventListener('change',renderMedicineLogs);
  renderMedicineLogs();
});


// Quiz TB Anak
const tbQuiz=[
 {q:'Apa itu TB (Tuberkulosis) pada anak?',a:['Penyakit yang hanya menyerang kulit','Penyakit menular yang dapat menyerang paru-paru dan organ lain','Alergi biasa','Penyakit karena kekurangan vitamin'],c:1},
 {q:'Bagaimana kuman TB dapat menyebar?',a:['Melalui udara saat penderita TB batuk atau bersin','Melalui warna pakaian','Karena terlalu sering bermain','Karena makan buah'],c:0},
 {q:'Gejala apa yang perlu diperhatikan pada anak?',a:['Berat badan sulit naik atau menurun','Rambut tumbuh lebih cepat','Kuku menjadi panjang','Anak sering tertawa'],c:0},
 {q:'Apa yang sebaiknya dilakukan selama pengobatan TB?',a:['Berhenti minum obat saat terlihat sehat','Minum obat sesuai jadwal dan kontrol sesuai anjuran','Mengubah dosis sendiri','Minum obat hanya saat demam'],c:1},
 {q:'Apa salah satu cara membantu mencegah penularan TB di rumah?',a:['Menutup semua jendela','Membiarkan rumah pengap','Membuka jendela agar udara berganti','Menghentikan pengobatan lebih cepat'],c:2}
];
let quizIndex=0,quizScoreValue=0,quizAnswered=false;
const qN=document.getElementById('quizNumber'),qS=document.getElementById('quizScore'),qQ=document.getElementById('quizQuestion'),qA=document.getElementById('quizAnswers'),qF=document.getElementById('quizFeedback'),qNext=document.getElementById('quizNext');
function drawQuiz(){
 if(!qQ)return;
 if(quizIndex>=tbQuiz.length){document.getElementById('quizProgress').style.width='100%';qN.textContent='Selesai';qQ.textContent=`Quiz selesai! Skor kamu ${quizScoreValue} dari ${tbQuiz.length}.`;qA.innerHTML='<div class="note">Terima kasih sudah belajar tentang TB pada anak. Tekan tombol di bawah untuk mengulang quiz.</div>';qF.textContent='';qNext.textContent='Ulangi Quiz';qNext.disabled=false;return;}
 document.getElementById('quizProgress').style.width=((quizIndex+1)/tbQuiz.length*100)+'%';
 const x=tbQuiz[quizIndex];quizAnswered=false;qN.textContent=`${quizIndex+1} / ${tbQuiz.length}`;qS.textContent=`Skor: ${quizScoreValue}`;qQ.textContent=x.q;qF.textContent='';qNext.disabled=true;qNext.textContent=quizIndex===tbQuiz.length-1?'Lihat Hasil':'Selanjutnya ›';
 qA.innerHTML=x.a.map((t,i)=>`<button class="quiz-answer" data-i="${i}">${String.fromCharCode(65+i)}. ${t}</button>`).join('');
 document.querySelectorAll('.quiz-answer').forEach(btn=>btn.addEventListener('click',()=>{if(quizAnswered)return;quizAnswered=true;const pick=Number(btn.dataset.i);document.querySelectorAll('.quiz-answer').forEach((b,i)=>{if(i===x.c)b.classList.add('correct');else if(i===pick)b.classList.add('wrong')});if(pick===x.c){quizScoreValue++;qF.textContent='Benar! 👍'}else qF.textContent='Belum tepat. Jawaban yang benar sudah ditandai.';qS.textContent=`Skor: ${quizScoreValue}`;qNext.disabled=false;}));
}
qNext?.addEventListener('click',()=>{if(quizIndex>=tbQuiz.length){quizIndex=0;quizScoreValue=0}else quizIndex++;drawQuiz()});
drawQuiz();

// Website navigation & subtle entrance animations
const goTop=document.querySelector('.back-to-top');
window.addEventListener('scroll',()=>goTop?.classList.toggle('visible',window.scrollY>500),{passive:true});
const links=[...document.querySelectorAll('.nav-links a[href^="#"]')];
const sections=[...document.querySelectorAll('main section[id]')];
if('IntersectionObserver' in window){
  const sectionObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){links.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+entry.target.id));}});
  },{rootMargin:'-25% 0px -62% 0px'});
  sections.forEach(el=>sectionObserver.observe(el));
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const targets=document.querySelectorAll('.learning-card,.section-heading,.card,.symptom,.timeline-item,.faq details');
    targets.forEach(el=>el.classList.add('reveal'));
    const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');revealObserver.unobserve(e.target)}}),{threshold:.08});
    targets.forEach(el=>revealObserver.observe(el));
  }
}

// Visual adherence dashboard, computed from the same local records.
(function(){
  const original=window.renderMedicineLogs;
  if(typeof original==='function') window.renderMedicineLogs=function(){
    original();
    const logs=getMedicineLogs();
    const done=logs.filter(x=>x.status==='Sudah diminum').length;
    const pct=logs.length?Math.round(done/logs.length*100):0;
    const ring=document.getElementById('adherenceRing');
    if(ring)ring.style.setProperty('--progress',pct+'%');
    const val=document.getElementById('adherencePercent');
    if(val)val.textContent=pct+'%';
  };
  document.addEventListener('DOMContentLoaded',()=>window.renderMedicineLogs?.());
})();

// Simpan skor kuis terbaik di browser; tanpa pelacakan progres materi.
const BEST_KEY='tbAnakCareBestQuiz';
function drawPortal(){const logs=getMedicineLogs();const $=id=>document.getElementById(id);if($('dashRecords'))$('dashRecords').textContent=logs.length;if($('dashTaken'))$('dashTaken').textContent=logs.filter(x=>x.status==='Sudah diminum').length;if($('dashQuiz'))$('dashQuiz').textContent=localStorage.getItem(BEST_KEY)??'—'}
const kindness=['Kamu tidak harus tahu semuanya sekaligus.','Mendampingi si kecil adalah perjalanan yang penuh kasih.','Pertanyaan kecil hari ini bisa membawa pemahaman besar besok.','Catatan yang rapi membantu keluarga saat konsultasi.'];let kindnessIndex=0;document.getElementById('newMessage')?.addEventListener('click',()=>{kindnessIndex=(kindnessIndex+1)%kindness.length;document.getElementById('kindMessage').textContent=kindness[kindnessIndex]});
// Perbarui dashboard setiap kali log obat diubah.
const oldSaveMedicineLogs=saveMedicineLogs;saveMedicineLogs=function(logs){oldSaveMedicineLogs(logs);drawPortal()};
const oldRenderMedicineLogs=renderMedicineLogs;renderMedicineLogs=function(){oldRenderMedicineLogs();drawPortal()};
const oldDrawQuiz=drawQuiz;drawQuiz=function(){if(quizIndex>=tbQuiz.length){const best=Number(localStorage.getItem(BEST_KEY)||0);if(quizScoreValue>best)localStorage.setItem(BEST_KEY,String(quizScoreValue));drawPortal()}oldDrawQuiz()};
document.addEventListener('DOMContentLoaded',drawPortal);


// Kalender obat: menggunakan catatan lama di localStorage, tanpa migrasi data.
let calendarViewDate = new Date();
let calendarSelectedDate = localISO(new Date());
function localISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function renderMedicineCalendar(){
  const grid=document.getElementById('medicineCalendar');
  if(!grid) return;
  const logs=getMedicineLogs();
  const year=calendarViewDate.getFullYear(),month=calendarViewDate.getMonth();
  document.getElementById('calendarMonthLabel').textContent=new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric'}).format(calendarViewDate);
  const first=new Date(year,month,1),offset=(first.getDay()+6)%7;
  const days=new Date(year,month+1,0).getDate();
  const today=localISO(new Date());
  const fragment=document.createDocumentFragment();
  for(let i=0;i<offset;i++){let blank=document.createElement('span');blank.className='calendar-blank';fragment.append(blank)}
  for(let d=1;d<=days;d++){
    const date=localISO(new Date(year,month,d));
    const items=logs.filter(log=>log.tanggal===date);
    const done=items.filter(log=>log.status==='Sudah diminum').length;
    const state=!items.length?'none':done===items.length?'done':done===0?'missed':'mixed';
    const b=document.createElement('button');b.type='button';
    b.className=`calendar-day ${state}${date===today?' is-today':''}${date===calendarSelectedDate?' is-selected':''}`;
    b.setAttribute('aria-label',`${new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'long',year:'numeric'}).format(new Date(year,month,d))}, ${items.length?`${done} dari ${items.length} catatan sudah diminum`:'belum ada catatan'}`);
    b.setAttribute('aria-pressed',String(date===calendarSelectedDate));
    b.innerHTML=`<span class="day-number">${d}</span><span class="day-dot"></span>`;
    b.addEventListener('click',()=>selectCalendarDate(date));fragment.append(b);
  }
  grid.replaceChildren(fragment);
  renderSelectedCalendarDay(logs);
}
function selectCalendarDate(date){
  calendarSelectedDate=date;
  const [y,m]=date.split('-').map(Number);
  calendarViewDate=new Date(y,m-1,1);
  const dateInput=document.getElementById('tanggal');if(dateInput)dateInput.value=date;
  renderMedicineCalendar();
}
function renderSelectedCalendarDay(logs){
  const date=calendarSelectedDate;
  document.getElementById('selectedDayHeading').textContent=new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(date+'T12:00:00'));
  const selected=logs.map((log,index)=>({...log,sourceIndex:index})).filter(log=>log.tanggal===date);
  const intro=document.getElementById('selectedDayIntro');
  intro.textContent=selected.length?`${selected.length} catatan tersimpan untuk tanggal ini.`:'Belum ada catatan obat pada tanggal ini.';
  const list=document.getElementById('selectedDayLogs');list.replaceChildren();
  for(const log of selected){
    const entry=document.createElement('div');entry.className='day-log-card';
    const name=document.createElement('strong');name.textContent=log.obat;
    const status=document.createElement('span');status.className='day-log-status '+(log.status==='Sudah diminum'?'status-done':'status-missed');status.textContent=log.status;
    const info=document.createElement('small');info.textContent=[log.waktu,log.catatan].filter(Boolean).join(' · ')||'Tanpa catatan tambahan';
    const del=document.createElement('button');del.type='button';del.textContent='Hapus';del.setAttribute('aria-label',`Hapus catatan ${log.obat}`);del.addEventListener('click',()=>{if(confirm('Hapus catatan obat ini?'))deleteMedicineLog(log.sourceIndex)});
    entry.append(name,status,info,del);list.append(entry);
  }
}
document.addEventListener('DOMContentLoaded',()=>{
  if(!document.getElementById('medicineCalendar')) return;
  selectCalendarDate(localISO(new Date()));
  document.getElementById('calendarPrev')?.addEventListener('click',()=>{calendarViewDate=new Date(calendarViewDate.getFullYear(),calendarViewDate.getMonth()-1,1);renderMedicineCalendar()});
  document.getElementById('calendarNext')?.addEventListener('click',()=>{calendarViewDate=new Date(calendarViewDate.getFullYear(),calendarViewDate.getMonth()+1,1);renderMedicineCalendar()});
  document.getElementById('calendarToday')?.addEventListener('click',()=>selectCalendarDate(localISO(new Date())));
  document.getElementById('tanggal')?.addEventListener('change',e=>{if(/^\d{4}-\d{2}-\d{2}$/.test(e.target.value))selectCalendarDate(e.target.value)});
  document.getElementById('focusMedicineForm')?.addEventListener('click',()=>{document.getElementById('advancedMedicineEntry').open=true;document.getElementById('medicineForm')?.scrollIntoView({behavior:'smooth',block:'center'});document.getElementById('obat')?.focus({preventScroll:true})});
});


// Pencatatan 1-tap. Memakai data lama dan penyimpanan yang sama.
const QUICK_MED_KEY='tbAnakCareQuickMedicineName';
function quickMedicineFeedback(message, isError=false){
 const el=document.getElementById('quickFeedback');
 if(el){el.textContent=message;el.classList.toggle('is-error',isError)}
}
function quickMedicineSaveName(){
 const input=document.getElementById('quickMedicineName');
 const name=input?.value.trim();
 if(!name){quickMedicineFeedback('Isi nama obat sesuai resep terlebih dahulu.',true);input?.focus();return false}
 try{localStorage.setItem(QUICK_MED_KEY,name)}catch(e){quickMedicineFeedback('Penyimpanan browser tidak tersedia. Periksa pengaturan browser.',true);return false}
 quickMedicineFeedback('Nama obat tersimpan. Sekarang cukup pilih tanggal dan statusnya.');return true;
}
function quickRecordMedicine(status){
 const input=document.getElementById('quickMedicineName');
 const name=input?.value.trim();
 if(!name){quickMedicineFeedback('Isi nama obat yang diresepkan terlebih dahulu.',true);input?.focus();return}
 const logs=getMedicineLogs();
 // Jika catatan nama obat & tanggal yang sama ada, perbarui supaya tidak ganda.
 const matches=logs.map((x,i)=>({x,i})).filter(({x})=>x.tanggal===calendarSelectedDate&&String(x.obat).trim().toLowerCase()===name.toLowerCase());
 if(matches.length>1){quickMedicineFeedback('Ada beberapa catatan obat ini di tanggal yang sama. Gunakan catatan lengkap untuk mengubahnya.',true);return}
 if(matches.length===1){logs[matches[0].i].status=status}
 else logs.unshift({obat:name,tanggal:calendarSelectedDate,waktu:'',status,catatan:''});
 try{localStorage.setItem(QUICK_MED_KEY,name);saveMedicineLogs(logs)}catch(e){quickMedicineFeedback('Gagal menyimpan. Periksa pengaturan atau ruang penyimpanan browser.',true);return}
 renderMedicineLogs();
 quickMedicineFeedback(`${status==='Sudah diminum'?'✓ Sudah minum':'Belum minum'} dicatat untuk ${formatDateID(calendarSelectedDate)}. Kamu bisa mengubahnya dengan menekan tombol lain.`);
}
document.addEventListener('DOMContentLoaded',()=>{
 const name=document.getElementById('quickMedicineName');
 if(name){try{name.value=localStorage.getItem(QUICK_MED_KEY)||''}catch(e){} }
 document.getElementById('quickSaveName')?.addEventListener('click',quickMedicineSaveName);
 document.getElementById('quickTaken')?.addEventListener('click',()=>quickRecordMedicine('Sudah diminum'));
 document.getElementById('quickMissed')?.addEventListener('click',()=>quickRecordMedicine('Belum diminum'));
 name?.addEventListener('change',()=>quickMedicineFeedback('Tekan Simpan untuk menggunakan nama obat ini berikutnya.'));
});
