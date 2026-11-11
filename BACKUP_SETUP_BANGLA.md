## চালু ডাটা সুরক্ষা — ১১ নভেম্বর ২০২৬

- প্রতিটি নতুন আর্থিক সেভে আগের ও পরের সংস্করণ একই atomic update-এ সংরক্ষিত হয়।
- DSO দৈনিক হিসাব, Investment ও Bank-এর রেকর্ড/পুরো তালিকা সরাসরি ডিলিট করা বন্ধ। পুরোনো ইতিহাস পরিবর্তন বা ডিলিট করা যায় না।
- সেভ করা স্লিপের মূল ছবি মুছতে বা অন্য ছবি দিয়ে প্রতিস্থাপন করতে দেওয়া হয় না।
- আগে সেভ করা হিসাবের তারিখ সরিয়ে পুরোনো রেকর্ড সরানো বন্ধ; একই তারিখে সংশোধন করলে ইতিহাস থাকে।
- প্রতি ঘণ্টার ১৭ মিনিটে আর্থিক metadata/history-এর এনক্রিপ্টেড ব্যাকআপের সূচি চালু। প্রতিদিন বাংলাদেশ সময় রাত ১:১৭-তে ছবি ও সব RTDB রুটসহ Full Backup-এর সূচি চালু। GitHub-এর সময়সূচিতে বিলম্ব হতে পারে।
- প্রতিটি সংরক্ষিত ব্যাকআপ আবার ডাউনলোড করে checksum, decryption, আলাদা ফাইলে restore এবং নষ্ট/ভুল পাসফ্রেজ প্রত্যাখ্যান পরীক্ষা করা হয়।
- Full Backup-এ Firebase Authentication user export-ও নেওয়া হয় যখন Service Account-এর অনুমতি আছে; password-hash configuration সম্পূর্ণ না থাকলে পুনরুদ্ধারের পর password reset লাগতে পারে। ব্যাকআপের ফলেই এর অবস্থা জানানো হয়।
- নিয়মিত কপি Firebase-এর বাইরে GitHub Actions-এর artifacts-এ ৯০ দিন থাকে। ১১ নভেম্বরের যাচাইকৃত একটি ফুল ব্যাকআপের অতিরিক্ত ব্যক্তিগত কপিও সংরক্ষিত আছে।
- Admin → Settings → “ডাটা সুরক্ষা ও পরিবর্তনের ইতিহাস” থেকে সর্বশেষ ব্যাকআপ, রিস্টোরের ফল এবং সাম্প্রতিক পরিবর্তনের আগে/পরে দেখা যাবে।
- পুরোনো ডাটার অতীত edit-history নতুন করে বানানো হয়নি; সুরক্ষা চালুর আগের ডাটা ফুল ব্যাকআপে আছে।
- পুনরুদ্ধারের আগে বর্তমান ডাটার নতুন ব্যাকআপ নিয়ে কোন সংস্করণ ফিরবে তা মিলিয়ে নিন। পুরোনো ব্যাকআপ দিয়ে চলমান ডাটা অন্ধভাবে overwrite করবেন না।

ব্যাকআপ খুলতে GitHub-এ দেওয়া `BACKUP_PASSPHRASE` লাগবে। পাসফ্রেজ চ্যাটে লিখবেন না; আপনার নিজের নিরাপদ জায়গায় রাখুন।

---

## বর্তমান অবস্থা

সুরক্ষিত Rules প্রকাশ করা হয়েছে এবং Full ও ঘণ্টাভিত্তিক Backup সফলভাবে যাচাই হয়েছে। নিচের Secret setup ধাপগুলো কেবল নতুন repository বা পুনরায় setup-এর জন্য; চালু অ্যাপে পুরোনো Rules দিয়ে বর্তমান Rules প্রতিস্থাপন করবেন না।

# Hisab360 — Backup চালু করা

অ্যাপের Settings → Data Backup শুধু মূল Admin দেখবেন। Backup Download-এর জন্য বর্তমান Admin Login password দিতে হবে। Firebase সেটি যাচাই করার পর financial data পড়বে ও একই password দিয়ে file encrypt করবে। Password কোথাও নতুন করে সংরক্ষণ করা হয় না। তৈরি হওয়া file private জায়গায় রাখুন।

Backup তৈরির সময়কার password দিয়েই পরে ওই file খোলা যাবে। Admin password পরিবর্তন করলে পুরোনো file-এর জন্য পুরোনো password প্রয়োজন হবে। একই ঘরে সেই password দিয়ে Backup যাচাই করতে পারেন। আলাদা কোনো Backup password বা confirmation input লাগবে না। স্বয়ংক্রিয় workflow-এর file যাচাইয়ের সময় ওই workflow-এর BACKUP_PASSPHRASE ব্যবহার করুন। যাচাই বা download কোনো live data পরিবর্তন করে না।

## দৈনিক Full Database Backup চালু করতে

1. GitHub-এর এই ঠিকানা খুলুন: https://github.com/ZahangirKabir/hisab360/settings/secrets/actions
2. **New repository secret** চাপুন। Name: `FIREBASE_SERVICE_ACCOUNT_JSON`। Secret ঘরে Firebase-এর service-account JSON ফাইলের সম্পূর্ণ লেখা বসিয়ে **Add secret** দিন। এটি GitHub-এর সাধারণ ফাইল হিসেবে upload করবেন না এবং chat-এ পাঠাবেন না।
3. আরেকটি Secret যোগ করুন। Name: `BACKUP_PASSPHRASE`। Secret ঘরে নতুন কমপক্ষে ১৬ অক্ষরের, সম্ভব হলে ২৪ বা বেশি অক্ষরের শক্ত password দিন। এটি আলাদা নিরাপদ জায়গায় রাখুন।
4. https://github.com/ZahangirKabir/hisab360/actions খুলুন → **Hisab360 Financial Backup** → **Run workflow** → সবুজ Success হওয়া পর্যন্ত অপেক্ষা করুন।
5. সফল Run খুলুন → Artifacts → `Hisab360-encrypted-backup-...` Download করুন। ZIP Extract করে `.hisabbackup` ফাইলটি অ্যাপের **Data Backup → Backup যাচাই** দিয়ে পরীক্ষা করুন। এর জন্য Admin password ঘরে workflow-এর `BACKUP_PASSPHRASE` লিখতে হবে। যাচাই পুরোনো encrypted file পড়বে; নতুন download-এর ক্ষেত্রে শুধু বর্তমান Admin Login password গ্রহণযোগ্য।

প্রথম Success এবং যাচাই হওয়ার আগে স্বয়ংক্রিয় Backup চালু হয়েছে ধরে নেবেন না। কোনো Secret ভুল হলে workflow ব্যর্থ হবে। আমি আপনার হয়ে Secret-এর মান দেখতে বা বসাতে পারি না।

## সময় ও কী সংরক্ষণ হবে

- প্রতিদিন বাংলাদেশ সময় রাত ১:১৭-তে workflow চালুর অনুরোধ হবে। GitHub schedule দেরি করতে পারে; এটি নির্দিষ্ট সময়ে চালুর নিশ্চয়তা নয়। Public repository দীর্ঘদিন নিষ্ক্রিয় থাকলে scheduled workflow বন্ধ হতে পারে। নিয়মিত Actions-এর ফল দেখুন।
- Full backup: একটি server read-এ সম্পূর্ণ Realtime Database, embedded Bank Slip ছবি, financial data, account/device metadata এবং Database Rules। ফাইল download করার আগে encrypt ও decrypt করে মিলিয়ে দেখা হয়। কোনো live data লেখা বা মোছা হয় না।
- App-এর manual Backup: ledgerAccounts, collections, bankSlipRequests, investmentEntries, bankTrackerEntries, ledgerLocations, appConfig, notifications ও slipImages। এটি financial-path backup, সম্পূর্ণ account/device/Rules backup নয়। আলাদা আলাদা path পড়া হয়, তাই চলমান লেনদেনের মধ্যে এক মুহূর্তের atomic snapshot নয়। Full backup-এর বিকল্প নয়।
- স্বয়ংক্রিয় Full Backup-এ অনুমতি থাকা সাপেক্ষে Firebase Authentication user export ও password-hash configuration থাকে; ১১ নভেম্বরের সর্বশেষ Full Backup-এ দুটিই সফল হয়েছে। App-এর manual backup-এ Authentication export নেই। বাহিরের Storage file অন্তর্ভুক্ত নয়; RTDB-তে থাকা Bank Slip ছবি Full Backup-এ থাকে।
- GitHub artifact সর্বোচ্চ ৯০ দিন রাখার অনুরোধ করা আছে; repository policy কম সময় নির্ধারণ করতে পারে। মেয়াদ শেষ হওয়ার আগে নিজের private storage-এ আরও একটি copy রাখুন। Public repository-র artifact-এও শুধু encrypted file থাকে।
- বড় লেনদেন/পরিবর্তনের আগে ও পরে প্রয়োজনমতো Run workflow করুন। দুটি backup-এর মধ্যবর্তী পরিবর্তন শেষ backup-এ থাকবে না। Backup হলো recovery ব্যবস্থা; এটি zero-data-loss guarantee নয়। Firebase-এর quota/নেটওয়ার্ক/অ্যাকাউন্টের সমস্যা ব্যাকআপ ব্যর্থ করতে পারে।
- Backup password বা service-account key বদলালে পুরোনো backup-এর পুরোনো password ধরে রাখুন।

## পুনরুদ্ধার

ভুল ফাইল সরাসরি Firebase-এ Import করবেন না। আগে ব্যাকআপ যাচাই, বর্তমান data-এর backup, তারপর আলাদা database-এ restore পরীক্ষা করতে হবে। অ্যাপে কোনো live Restore/Delete বাটন যোগ করা হয়নি।

প্রয়োজনে `scripts/decrypt-backup.cjs` এবং `scripts/financial-backup.cjs` একই folder-এ রেখে offline-এ decrypt করা যায়। `BACKUP_PASSPHRASE` environment variable ব্যবহার করতে হবে। Command: `node decrypt-backup.cjs saved.hisabbackup recovered.json`। এটি শুধু নতুন local JSON file তৈরি করে; Firebase-এ কিছু লেখে না। একই নামের output থাকলে overwrite করে না।

প্রথম backup সফল হওয়ার পর অতিরিক্ত স্বতন্ত্র private copy রাখুন এবং মাঝে মাঝে খুলে যাচাই করুন।
