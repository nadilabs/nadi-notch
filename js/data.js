/** Pure data — markup and component behaviors live in their own modules. */
export const previewModes = [
  { id:'resting', image:'resting-native-150.png', width:156, height:30, en:{name:'Resting',desc:'Nadi settles into its quiet mascot state.'}, idn:{name:'Resting',desc:'Nadi beristirahat dengan tampilan maskot yang tenang.'}},
  { id:'closed', image:'closed-native-150.png', width:156,height:30, en:{name:'Closed',desc:'A compact clock and status display.'},idn:{name:'Closed',desc:'Tampilan jam dan status yang ringkas.'}},
  { id:'music', image:'music-native-150.png', width:440,height:144, en:{name:'Music',desc:'Playback, artwork and controls near the top edge.'},idn:{name:'Music',desc:'Artwork, pemutaran, dan kontrol musik di bagian atas layar.'}},
  { id:'lyrics', image:'lyrics-native-150.png', width:560,height:144, en:{name:'Lyrics',desc:'A dedicated space for timed lyrics.'},idn:{name:'Lyrics',desc:'Ruang khusus untuk lirik tersinkron.'}},
  { id:'pomodoro', image:'pomodoro-native-150.png', width:440,height:144, en:{name:'Pomodoro',desc:'The new timeline theme for focus and breaks.'},idn:{name:'Pomodoro',desc:'Tema Timeline baru untuk fokus dan istirahat.'}},
  { id:'water', image:'water-native-150.png', width:440,height:144, en:{name:'Water',desc:'A gentle reminder to stay hydrated.'},idn:{name:'Water',desc:'Pengingat lembut untuk menjaga asupan air.'}},
  { id:'shelf', image:'shelf-native-150.png', width:440,height:144, en:{name:'Shelf',desc:'Files and clipboard together in one place.'},idn:{name:'Shelf',desc:'File dan clipboard dalam satu tempat.'}},
  { id:'todo', image:'todo.png', width:440,height:144, en:{name:'To-do',desc:"Keep today's tasks in sight."},idn:{name:'To-do',desc:'Pantau tugas hari ini tanpa jendela tambahan.'}},
  { id:'calendar', image:'calendar.png', width:460,height:340, en:{name:'Calendar',desc:'A complete view of tasks across the month.'},idn:{name:'Calendar',desc:'Lihat tugas selama sebulan dalam satu kalender.'}},
  { id:'pray', image:'pray.png', width:440,height:144, en:{name:'Pray',desc:"Today's prayer schedule in a compact view."},idn:{name:'Pray',desc:'Jadwal salat hari ini dalam tampilan ringkas.'}},
  { id:'power', image:'power-native-150.png', width:440,height:144, en:{name:'Power',desc:'Battery and charging information at a glance.'},idn:{name:'Power',desc:'Informasi baterai dan daya dalam sekejap.'}},
  { id:'widgets', image:'widgets.png', width:440,height:144, en:{name:'Widgets',desc:'Personalized information without extra windows.'},idn:{name:'Widgets',desc:'Informasi pilihan tanpa membuka jendela tambahan.'}},
  { id:'today', image:'today.png', width:440,height:144, en:{name:'Today',desc:'A glance at the day ahead, with honest notification states.'},idn:{name:'Today',desc:'Ringkasan hari ini dengan status notifikasi yang transparan.'}},
  { id:'hud', image:'hud-volume.png', width:420,height:44, en:{name:'System HUD',desc:'Compact native system feedback.'},idn:{name:'System HUD',desc:'Indikator sistem yang ringkas.'}},
];

export const features = [
  {icon:'music',color:'#48b6ff',en:['Music that follows you','See artwork and playback controls without leaving what you’re doing.'],idn:['Musik yang selalu dekat','Lihat artwork dan kontrol pemutaran tanpa berpindah jendela.']},
  {icon:'lyrics',color:'#9984ff',en:['Synced lyrics','Follow the words as they play, from peek to expanded view.'],idn:['Lirik tersinkron','Ikuti lirik secara langsung, dari mode Peek hingga Expanded.']},
  {icon:'timer',color:'#ff687f',en:['Pomodoro, two ways','Classic focus ring or the new session timeline for your day.'],idn:['Dua tema Pomodoro','Pilih ring Classic atau Timeline sesi fokus dan istirahat.']},
  {icon:'droplet',color:'#48b6ff',en:['Water Reminder','Track your intake and get gentle reminders on your schedule.'],idn:['Water Reminder','Catat asupan air dan atur pengingat sesuai rutinitas.']},
  {icon:'folder',color:'#f4c66c',en:['Shelf + Clipboard','Keep files and copied text within quick reach in the same Shelf.'],idn:['Shelf + Clipboard','Simpan file dan teks tersalin di satu Shelf yang mudah dijangkau.']},
  {icon:'list',color:'#53de92',en:['To-do & Calendar','Plan tasks, track progress and see your week in context.'],idn:['To-do & Calendar','Susun tugas, pantau progres, dan lihat jadwal dalam kalender.']},
  {icon:'pray',color:'#a6c9ff',en:['Pray Reminder','Optional local prayer schedules and timely, quiet reminders.'],idn:['Pray Reminder','Jadwal salat sesuai lokasi dan pengingat yang tidak mengganggu.']},
  {icon:'battery',color:'#51ff00',en:['Power Status','A glanceable view of available battery and power information.'],idn:['Power Status','Lihat status baterai dan sumber daya dengan cepat.']},
  {icon:'bell',color:'#ffb87b',en:['System HUD','Designed for volume, brightness, connectivity and keyboard feedback.'],idn:['System HUD','Indikator volume, kecerahan, konektivitas, dan keyboard.']},
  {icon:'grid',color:'#b5a2ff',en:['Your Widgets','Mix practical information in a space that fits your desktop.'],idn:['Widgets sesuai kebutuhan','Gabungkan informasi praktis sesuai aktivitas desktop.']},
  {icon:'calendar',color:'#4ed3e4',en:['Today, at a glance','A dedicated view of today’s tasks and supported notifications.'],idn:['Today dalam sekejap','Tampilan terpisah untuk tugas harian dan notifikasi yang didukung.']},
  {icon:'settings',color:'#8bb5ed',en:['Adaptive Minimal','A notch that knows when to stay small and when to make space.'],idn:['Adaptive Minimal','Notch menyesuaikan ruang kerja dan tampil hanya saat dibutuhkan.']},
];

export const questions = [
  {en:['What is Nadi?','Nadi is an independently built adaptive notch for Windows. It gathers music controls, focus tools, reminders, Shelf and other desktop essentials along the top edge of your screen.'],idn:['Apa itu Nadi?','Nadi adalah notch adaptif untuk Windows yang dikembangkan secara independen. Musik, fokus, pengingat, Shelf, dan kebutuhan desktop lain tersedia di tepi atas layar.']},
  {en:['Is Nadi free?','Nadi is intended to be free to use, without subscriptions. Optional contributions can support development.'],idn:['Apakah Nadi gratis?','Nadi direncanakan gratis tanpa biaya berlangganan. Dukungan sukarela dapat membantu pengembangannya.']},
  {en:['Which Windows versions are supported?','Nadi targets Windows 10 and Windows 11 on x64 PCs. Some system integrations depend on device hardware and Windows permissions.'],idn:['Mendukung Windows versi apa?','Nadi ditujukan untuk Windows 10 dan Windows 11 pada PC x64. Sebagian integrasi bergantung pada perangkat dan izin Windows.']},
  {en:['Does Nadi need an account?','No Nadi account is required. To-do and water data are stored locally; Clipboard history is temporary and held in memory.'],idn:['Perlukah membuat akun?','Tidak perlu. Data To-do dan Water disimpan secara lokal; riwayat Clipboard bersifat sementara di memori.']},
  {en:['Can Nadi read all my notifications?','Not by default. Windows notification access requires system permissions and supported packaging. The classic installer may not be able to provide that capability.'],idn:['Bisakah Nadi membaca semua notifikasi?','Tidak otomatis. Akses notifikasi membutuhkan izin Windows dan format instalasi yang didukung. Installer klasik mungkin belum dapat menyediakan fitur ini.']},
  {en:['When can I download Nadi?','The public release link will appear here when a verified installer is ready. The website does not provide an unofficial executable.'],idn:['Kapan Nadi dapat diunduh?','Tautan rilis publik akan tersedia setelah installer selesai diverifikasi. Situs ini tidak menyediakan executable tidak resmi.']},
];
