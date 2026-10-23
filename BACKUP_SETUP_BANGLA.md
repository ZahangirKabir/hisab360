# Hisab360 — Backup চালু করা

অ্যাপের Data Backup মেনু শুধু মূল Admin দেখবেন। Backup Download-এ নতুন একটি কমপক্ষে ১৬ অক্ষরের backup password দুবার লিখে download করুন। ফাইল ও password আলাদা নিরাপদ জায়গায় রাখুন। Password হারালে encrypted backup খোলা যাবে না। এই password আপনার Login password থেকে আলাদা রাখুন। Backup যাচাই বাটনে ফাইলটি বেছে একই password দিয়ে পরীক্ষা করা যায়। যাচাই বা download কোনো live data পরিবর্তন করে না।

## দৈনিক Full Database Backup চালু করতে

1. GitHub-এর এই ঠিকানা খুলুন: https://github.com/ZahangirKabir/hisab360/settings/secrets/actions
2. **New repository secret** চাপুন। Name: `FIREBASE_SERVICE_ACCOUNT_JSON`। Secret ঘরে Firebase-এর service-account JSON ফাইলের সম্পূর্ণ লেখা বসিয়ে **Add secret** দিন। এটি GitHub-এর সাধারণ ফাইল হিসেবে upload করবেন না এবং chat-এ পাঠাবেন না।
3. আরেকটি Secret যোগ করুন। Name: `BACKUP_PASSPHRASE`। Secret ঘরে নতুন কমপক্ষে ১৬ অক্ষরের, সম্ভব হলে ২৪ বা বেশি অক্ষরের শক্ত password দিন। এটি আলাদা নিরাপদ জায়গায় রাখুন।
4. https://github.com/ZahangirKabir/hisab360/actions খুলুন → **Hisab360 Financial Backup** → **Run workflow** → সবুজ Success হওয়া পর্যন্ত অপেক্ষা করুন।
5. সফল Run খুলুন → Artifacts → `Hisab360-encrypted-backup-...` Download করুন। ZIP Extract করে `.hisabbackup` ফাইলটি অ্যাপের **Data Backup → Backup যাচাই** দিয়ে পরীক্ষা করুন। এর জন্য একই `BACKUP_PASSPHRASE` দুটি ঘরে লিখতে হবে।

প্রথম Success এবং যাচাই হওয়ার আগে স্বয়ংক্রিয় Backup চালু হয়েছে ধরে নেবেন না। কোনো Secret ভুল হলে workflow ব্যর্থ হবে। আমি আপনার হয়ে Secret-এর মান দেখতে বা বসাতে পারি না।

## সময় ও কী সংরক্ষণ হবে

- প্রতিদিন বাংলাদেশ সময় রাত ১:১৭-তে workflow চালুর অনুরোধ হবে। GitHub schedule দেরি করতে পারে; এটি নির্দিষ্ট সময়ে চালুর নিশ্চয়তা নয়। Public repository দীর্ঘদিন নিষ্ক্রিয় থাকলে scheduled workflow বন্ধ হতে পারে। নিয়মিত Actions-এর ফল দেখুন।
- Full backup: একটি server read-এ সম্পূর্ণ Realtime Database, embedded Bank Slip ছবি, financial data, account/device metadata এবং Database Rules। ফাইল download করার আগে encrypt ও decrypt করে মিলিয়ে দেখা হয়। কোনো live data লেখা বা মোছা হয় না।
- App-এর manual Backup: ledgerAccounts, collections, bankSlipRequests, investmentEntries, bankTrackerEntries, ledgerLocations, appConfig, notifications ও slipImages। এটি financial-path backup, সম্পূর্ণ account/device/Rules backup নয়। আলাদা আলাদা path পড়া হয়, তাই চলমান লেনদেনের মধ্যে এক মুহূর্তের atomic snapshot নয়। Full backup-এর বিকল্প নয়।
- Firebase Authentication user/password এবং বাহিরের Storage file এই backup-এ নেই। RTDB account metadata Authentication account-এর বিকল্প নয়। Bank Slip ছবি RTDB-তে থাকলে অন্তর্ভুক্ত হবে।
- GitHub artifact সর্বোচ্চ ৯০ দিন রাখার অনুরোধ করা আছে; repository policy কম সময় নির্ধারণ করতে পারে। মেয়াদ শেষ হওয়ার আগে নিজের private storage-এ আরও একটি copy রাখুন। Public repository-র artifact-এও শুধু encrypted file থাকে।
- বড় লেনদেন/পরিবর্তনের আগে ও পরে প্রয়োজনমতো Run workflow করুন। দুটি backup-এর মধ্যবর্তী পরিবর্তন শেষ backup-এ থাকবে না। Backup হলো recovery ব্যবস্থা; এটি zero-data-loss guarantee নয়। Firebase-এর quota/নেটওয়ার্ক/অ্যাকাউন্টের সমস্যা ব্যাকআপ ব্যর্থ করতে পারে।
- Backup password বা service-account key বদলালে পুরোনো backup-এর পুরোনো password ধরে রাখুন।

## পুনরুদ্ধার

ভুল ফাইল সরাসরি Firebase-এ Import করবেন না। আগে ব্যাকআপ যাচাই, বর্তমান data-এর backup, তারপর আলাদা database-এ restore পরীক্ষা করতে হবে। অ্যাপে কোনো live Restore/Delete বাটন যোগ করা হয়নি।

প্রয়োজনে `scripts/decrypt-backup.cjs` এবং `scripts/financial-backup.cjs` একই folder-এ রেখে offline-এ decrypt করা যায়। `BACKUP_PASSPHRASE` environment variable ব্যবহার করতে হবে। Command: `node decrypt-backup.cjs saved.hisabbackup recovered.json`। এটি শুধু নতুন local JSON file তৈরি করে; Firebase-এ কিছু লেখে না। একই নামের output থাকলে overwrite করে না।

প্রথম backup সফল হওয়ার পর অতিরিক্ত স্বতন্ত্র private copy রাখুন এবং মাঝে মাঝে খুলে যাচাই করুন।
