"""Deterministic offline sound-design pass for the prototype's original cue library."""
import math
import random
import struct
import wave
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "assets" / "audio"
OUT.mkdir(parents=True, exist_ok=True)
RATE = 22050
RNG = random.Random(2147)

def write(name, samples):
    peak = max(0.001, max(abs(x) for x in samples))
    gain = min(1.0, 0.82 / peak)
    with wave.open(str(OUT / name), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(RATE)
        f.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, v * gain)) * 32767)) for v in samples))

def save_footstep():
    n = int(RATE * .34); a = []
    for i in range(n):
        t=i/RATE; env=math.exp(-t*17)*(0.6+0.4*math.sin(t*math.pi*9)**2)
        grit=RNG.uniform(-1,1)*math.exp(-t*37)
        thud=math.sin(2*math.pi*(76-28*t)*t)*math.exp(-t*12)
        a.append((grit*.23+thud*.42)*env)
    write("footstep.wav",a)

def save_ambience():
    n=RATE*12; a=[]; lp=0.0
    for i in range(n):
        t=i/RATE; noise=RNG.uniform(-1,1); lp=lp*.995+noise*.005
        swell=.5+.5*math.sin(2*math.pi*t/8)
        hum=math.sin(2*math.pi*49*t)+.28*math.sin(2*math.pi*98.3*t+.7)+.18*math.sin(2*math.pi*51.4*t)
        a.append((hum*.065+lp*.22+noise*.018)*(.65+.35*swell))
    write("ambience.wav",a)

def tonal(name, duration, freqs, noise=0.0, attack=.03, decay=1.5, wobble=0.0):
    n=int(RATE*duration); a=[]; lp=0
    for i in range(n):
        t=i/RATE; env=min(1,t/max(.001,attack))*math.exp(-t/decay)
        x=sum(math.sin(2*math.pi*(f+wobble*math.sin(t*2.1))*t+idx*.8)/(idx+1) for idx,f in enumerate(freqs))
        z=RNG.uniform(-1,1); lp=lp*.91+z*.09
        a.append((x*.19+lp*noise)*env)
    write(name,a)

def save_knock():
    n=RATE*3; a=[0.0]*n
    for onset in (.12,.59,1.05):
        for i in range(int(RATE*.32)):
            t=i/RATE; ix=int(onset*RATE)+i
            if ix<n:
                a[ix]+=(math.sin(2*math.pi*(96-12*t)*t)+.4*math.sin(2*math.pi*177*t))*math.exp(-t*16)*.42 + RNG.uniform(-1,1)*math.exp(-t*30)*.12
    write("knock.wav",a)

def save_creak():
    n=RATE*2; a=[]
    for i in range(n):
        t=i/RATE; env=math.sin(math.pi*t/2)**1.5
        freq=140+520*t+28*math.sin(t*13)
        a.append((math.sin(2*math.pi*freq*t)*.2+RNG.uniform(-1,1)*.035)*env)
    write("creak.wav",a)

save_footstep()
save_ambience()
tonal("whisper.wav",3.2,[380,590,920],noise=.13,attack=.4,decay=2.7,wobble=28)
tonal("breath.wav",2.5,[88,124],noise=.34,attack=.7,decay=2.6,wobble=5)
tonal("scream.wav",2.8,[470,715,1130],noise=.1,attack=.1,decay=1.8,wobble=150)
tonal("radio.wav",3.8,[720,1180,2320],noise=.45,attack=.08,decay=1.7,wobble=75)
tonal("elevator.wav",4.0,[41,53,161],noise=.14,attack=.1,decay=2.3,wobble=8)
tonal("entity.wav",3.5,[29,63,124],noise=.22,attack=.3,decay=3.4,wobble=13)
save_knock()
save_creak()
print("Generated", len(list(OUT.glob("*.wav"))), "original mono cues at", RATE, "Hz")
