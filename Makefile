# PIXANIME — короткие команды для рутинных операций
.PHONY: help episodes ep1 ep2 ep3 gif stills train sample showcase preview test clean s2 s2show s2net

help:
	@echo "make episodes   - отрендерить три эпизода в out/ (MP4 + WAV)"
	@echo "make ep1        - только первый эпизод"
	@echo "make gif        - первый эпизод в GIF (собственный LZW-энкодер)"
	@echo "make stills     - ключевые кадры в out/stills"
	@echo "make train      - обучить видео-диффузию (CPU, ~20 мин)"
	@echo "make sample     - сэмплировать клип из обученной модели"
	@echo "make showcase   - собрать витрину (mp4, gif, постер, index.html)"
	@echo "make preview    - локальный просмотр витрины на :8000"
	@echo "make test       - быстрые тесты движка"
	@echo "make clean      - удалить out/ и ckpt/"

episodes: ep1 ep2 ep3

ep1:
	python -m pixanime.cli render --episode 1

ep2:
	python -m pixanime.cli render --episode 2

ep3:
	python -m pixanime.cli render --episode 3

gif:
	python -m pixanime.cli render --episode 1 --gif --fps 10

stills:
	python -m pixanime.cli still --episode 1 --times 3,9,16,22,30,40,48,58

train:
	python -m pixanime.ml.train --steps 1500 --batch 4 --base 32 --out ckpt/pixvd.pt

sample:
	python -m pixanime.ml.sample --ckpt ckpt/pixvd.pt --cls 0 --n 3 --out out/ai_clip.gif

showcase:
	python -c "from pixanime.showcase import build_all; build_all()"

preview:
	python -m http.server 8000 --bind 0.0.0.0 --directory showcase

test:
	python tests/test_smoke.py

clean:
	rm -rf out ckpt

# --- второй сезон: 512x288, новый растр -------------------------------------
s2:            ## отрендерить 4 эпизода второго сезона (512x288, со звуком)
	python3 -c "import sys;sys.path.insert(0,'.');from pixanime.hi import series;series.render(['ep1','ep2','ep3','ep4'],'out/hi',scale=2)"

s2show: s2     ## витрина сезона: постер, лист персонажей, index.html, ссылки
	python3 -m pixanime.hi.showcase
	python3 -m pixanime.hi.neural_show || true
	python3 -m pixanime.cli links --sandbox "$$E2B_SANDBOX_ID" --write || true

s2net:         ## обучить сеть «поза -> спрайт» (CPU, ~15 минут)
	python3 -m pixanime.hi.neural --train
