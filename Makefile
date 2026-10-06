PORT ?= 8080
.PHONY: run check zip clean help
help: ; @echo "make run [PORT=8080] | make check | make zip | make clean"
run: ; @echo "http://localhost:$(PORT)"; python3 -m http.server $(PORT)
check: ; @for f in js/*.js js/components/*.js sw.js; do node --input-type=module --check < $$f || exit 1; done; echo OK
zip: ; zip -r teleprompter.zip . -x '.git/*' '*.zip'
clean: ; rm -f teleprompter.zip
