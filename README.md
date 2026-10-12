# Compilation of interesting proof of concept

- web-ext folder: web extension\
    Contain injection script untuk forward chat yang masuk ke extension dan forward text atau action dari extension ke chat secara otomatis (seperti untuk dice roll atau reminder)

- utilScript: python script untuk scraping pdf\
    Proof of concept untuk extract informasi dari pdf file ke json file

- server: simple deno web server with drizzle and sqlite db\
    Proof of concept web server untuk accomodate pertukaran informasi antar desktop client dan interop ke python script

- app folder: electron app\
    Proof of concept untuk bisa membuka 3rd part VTT in-app dan communicate dengan script injection seperti web-extension