import json
import struct
from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "EMERGENT_PROPERTIES_SUITE"
VERSION = "1_0_0"

AUDIO_EFFECT = 1633771873
INSTRUMENT = 1768515945


PALIMPSEST_CODE = r'''Param capture(1, min=0, max=1);
Param micro(0.48, min=0, max=1);
Param cloud(0.42, min=0, max=1);
Param memory(0.38, min=0, max=1);
Param fossil(0.25, min=0, max=1);
Param density(0.62, min=0, max=1);
Param reverse(0.18, min=0, max=1);
Param motion(0.34, min=0, max=1);
Param feedback(0.28, min=0, max=0.88);
Param space(0.72, min=0, max=1);
Param mix(0.58, min=0, max=1);
Param output(-8, min=-30, max=-1);
Param seed(71, min=1, max=9999);

Data palbank(576000, 2);
History windex(0);
History phaseone(0);
History phasetwo(0);
History phasethree(0);
History phasefour(0);

banksize = dim(palbank);
windex = wrap(windex + 1, 0, banksize);
oldleft = peek(palbank, windex, 0);
oldright = peek(palbank, windex, 1);
recordleft = tanh(in1 + oldright * feedback);
recordright = tanh(in2 + oldleft * feedback);
poke(palbank, oldleft + (recordleft - oldleft) * capture, windex, 0);
poke(palbank, oldright + (recordright - oldright) * capture, windex, 1);

phaseone = wrap(phaseone + (0.11 + motion * 1.7) / samplerate, 0, 1);
phasetwo = wrap(phasetwo + (0.037 + motion * 0.31) / samplerate, 0, 1);
phasethree = wrap(phasethree + (0.009 + motion * 0.07) / samplerate, 0, 1);
phasefour = wrap(phasefour + (0.002 + motion * 0.013) / samplerate, 0, 1);
direction = 1 - reverse * 2;

taponeleft = peek(palbank,
    windex - samplerate * 0.071 - direction * sin(twopi * phaseone) * samplerate * 0.031,
    0, interp="linear", boundmode="wrap");
taponeright = peek(palbank,
    windex - samplerate * (0.071 + space * 0.017) + direction * sin(twopi * phaseone) * samplerate * 0.031,
    1, interp="linear", boundmode="wrap");
taptwoleft = peek(palbank,
    windex - samplerate * 0.73 - direction * sin(twopi * phasetwo) * samplerate * 0.29,
    1, interp="linear", boundmode="wrap");
taptworight = peek(palbank,
    windex - samplerate * (0.73 + space * 0.11) + direction * sin(twopi * phasetwo) * samplerate * 0.29,
    0, interp="linear", boundmode="wrap");
tapthreeleft = peek(palbank,
    windex - min(banksize - 100, samplerate * 4.1) - sin(twopi * phasethree) * samplerate * 0.8,
    0, interp="linear", boundmode="wrap");
tapthreeright = peek(palbank,
    windex - min(banksize - 100, samplerate * (4.1 + space * 0.7)) + sin(twopi * phasethree) * samplerate * 0.8,
    1, interp="linear", boundmode="wrap");
tapfourleft = peek(palbank,
    windex - min(banksize - 100, samplerate * 9.3) - sin(twopi * phasefour) * samplerate * 1.1,
    1, interp="linear", boundmode="wrap");
tapfourright = peek(palbank,
    windex - min(banksize - 100, samplerate * (9.3 + space * 0.9)) + sin(twopi * phasefour) * samplerate * 1.1,
    0, interp="linear", boundmode="wrap");

wetleft = (taponeleft * micro + taptwoleft * cloud + tapthreeleft * memory + tapfourleft * fossil)
    * (0.32 + density * 0.48);
wetright = (taponeright * micro + taptworight * cloud + tapthreeright * memory + tapfourright * fossil)
    * (0.32 + density * 0.48);
gain = pow(10, output / 20);
out1 = dcblock(tanh((in1 * (1 - mix) + wetleft * mix) * 1.2)) * gain;
out2 = dcblock(tanh((in2 * (1 - mix) + wetright * mix) * 1.2)) * gain;'''


MONTAGE_CODE = r'''hashvalue(value) {
    h = sin(value * 14.171 + 91.733) * 43758.5453;
    return h - floor(h);
}

Param capture(1, min=0, max=1);
Param fragment(0.42, min=0, max=1);
Param history(0.44, min=0, max=1);
Param repeat(0.35, min=0, max=1);
Param reverse(0.21, min=0, max=1);
Param fracture(0.32, min=0, max=1);
Param rate(0.37, min=0.01, max=2);
Param density(0.66, min=0, max=1);
Param space(0.62, min=0, max=1);
Param feedback(0.16, min=0, max=0.75);
Param mix(0.54, min=0, max=1);
Param output(-8, min=-30, max=-1);
Param seed(113, min=1, max=9999);

Data montagebank(960000, 2);
History writehead(0);
History eventphase(0);
History lasteventphase(0);
History eventcount(0);
History startA(12000);
History startB(48000);
History lengthA(8000);
History lengthB(18000);
History readA(0);
History readB(0);
History dirA(1);
History dirB(1);
History ampA(0);
History ampB(0);
History fbL(0);
History fbR(0);

size = dim(montagebank);
writehead = wrap(writehead + 1, 0, size);
oldL = peek(montagebank, writehead, 0, interp="linear", boundmode="wrap");
oldR = peek(montagebank, writehead, 1, interp="linear", boundmode="wrap");
recL = tanh(in1 + fbR * feedback);
recR = tanh(in2 + fbL * feedback);
poke(montagebank, oldL + (recL - oldL) * capture, writehead, 0);
poke(montagebank, oldR + (recR - oldR) * capture, writehead, 1);

eventhz = 0.18 + rate * 3.7;
eventphase = wrap(eventphase + eventhz / samplerate, 0, 1);
eventtick = eventphase < lasteventphase;
lasteventphase = eventphase;

if (eventtick) {
    eventcount = eventcount + 1;
    h1 = hashvalue(eventcount + seed);
    h2 = hashvalue(eventcount * 1.733 + seed * 0.37);
    h3 = hashvalue(eventcount * 2.917 + seed * 0.81);
    h4 = hashvalue(eventcount * 4.171 + seed * 1.13);
    h5 = hashvalue(eventcount * 6.293 + seed * 1.79);
    if (h1 < density) {
        startB = startA;
        lengthB = lengthA;
        readB = readA;
        dirB = dirA;
        ampB = ampA;
        mindelay = samplerate * (0.08 + fragment * 0.12);
        maxdelay = samplerate * (1.1 + history * 17.0);
        startA = writehead - mindelay - h2 * maxdelay;
        lengthA = samplerate * (0.025 + fragment * fragment * 1.65) * (0.45 + h3 * 1.2);
        readA = 0;
        dirA = 1;
        if (h4 < reverse) { dirA = -1; }
        if (h5 < repeat) {
            startA = startB;
            lengthA = max(256, lengthB * (0.65 + h3 * 0.7));
            dirA = dirB;
        }
        ampA = 1;
    }
}

readrateA = (0.72 + rate * 0.43) * dirA;
readrateB = (0.61 + rate * 0.31) * dirB;
readA = readA + readrateA;
readB = readB + readrateB;
if (abs(readA) > lengthA) { readA = 0; ampA = ampA * repeat; }
if (abs(readB) > lengthB) { readB = 0; ampB = ampB * repeat; }

phaseA = abs(readA) / max(lengthA, 1);
phaseB = abs(readB) / max(lengthB, 1);
envA = sin(pi * clip(phaseA, 0, 1));
envB = sin(pi * clip(phaseB, 0, 1));
idxA = startA + readA;
idxB = startB + readB;
aL = peek(montagebank, idxA, 0, interp="linear", boundmode="wrap");
aR = peek(montagebank, idxA + space * 1931, 1, interp="linear", boundmode="wrap");
bL = peek(montagebank, idxB - space * 2741, 1, interp="linear", boundmode="wrap");
bR = peek(montagebank, idxB, 0, interp="linear", boundmode="wrap");

cutphase = wrap(eventphase * (2 + floor(fracture * 11)), 0, 1);
cutgate = 1;
if (cutphase < fracture * 0.075) { cutgate = 0; }
cutgate = slide(cutgate, samplerate * 0.003, samplerate * 0.003);

wetL = (aL * envA * ampA + bL * envB * ampB * history) * cutgate;
wetR = (aR * envA * ampA + bR * envB * ampB * history) * cutgate;
wetL = tanh(wetL * (1.2 + fracture * 2.8));
wetR = tanh(wetR * (1.2 + fracture * 2.8));
fbL = dcblock(wetL);
fbR = dcblock(wetR);

g = pow(10, output / 20);
out1 = dcblock(tanh((in1 * (1 - mix) + wetL * mix) * 1.1)) * g;
out2 = dcblock(tanh((in2 * (1 - mix) + wetR * mix) * 1.1)) * g;'''


LATTICE_CODE = r'''reson(input, frequency, decay) {
    History low(0);
    History band(0);
    f = 2 * sin(pi * clip(frequency, 20, samplerate * 0.43) / samplerate);
    damping = 0.018 + (1 - decay) * 0.28;
    high = input - low - band * damping;
    band = band + f * high;
    low = low + f * band;
    return band;
}

Param excite(0.55, min=0, max=1);
Param lattice(0.58, min=0, max=1);
Param coupling(0.24, min=0, max=0.78);
Param decay(0.72, min=0, max=0.995);
Param drift(0.21, min=0, max=1);
Param anchor(553.71, min=80, max=2200);
Param relation(0.62, min=0, max=1);
Param brightness(0.61, min=0, max=1);
Param space(0.78, min=0, max=1);
Param freeze(0, min=0, max=1);
Param mix(0.56, min=0, max=1);
Param output(-10, min=-30, max=-1);

History phase(0);
History groupA(0);
History groupB(0);
phase = wrap(phase + (0.011 + drift * 0.19) / samplerate, 0, 1);
movement1 = exp2(sin(twopi * phase) * drift * 0.31);
movement2 = exp2(sin(twopi * wrap(phase * 1.0625 + 0.27, 0, 1)) * drift * 0.24);

inputM = (in1 + in2) * 0.5 * excite;
inputS = (in1 - in2) * 0.5 * excite;
driveA = inputM + groupB * coupling;
driveB = inputS + groupA * coupling;
d = decay + freeze * (0.995 - decay);

a1 = reson(driveA, anchor * 0.503 * movement1, d);
a2 = reson(driveA, anchor * 0.667 * movement2, d);
a3 = reson(driveA, anchor * 0.809 * movement1, d);
a4 = reson(driveA, anchor * 1.000 * movement2, d);
a5 = reson(driveA, anchor * 1.337 * movement1, d);
a6 = reson(driveA, anchor * 1.618 * movement2, d);
a7 = reson(driveA, anchor * 2.117 * movement1, d);
a8 = reson(driveA, anchor * 2.719 * movement2, d);
a9 = reson(driveA, anchor * 3.913 * movement1, d);

ratio = 1.0 + relation * 0.122462;
b1 = reson(driveB, anchor * 0.557 * ratio / movement2, d);
b2 = reson(driveB, anchor * 0.739 * ratio / movement1, d);
b3 = reson(driveB, anchor * 0.917 * ratio / movement2, d);
b4 = reson(driveB, anchor * 1.127 * ratio / movement1, d);
b5 = reson(driveB, anchor * 1.493 * ratio / movement2, d);
b6 = reson(driveB, anchor * 1.871 * ratio / movement1, d);
b7 = reson(driveB, anchor * 2.431 * ratio / movement2, d);
b8 = reson(driveB, anchor * 3.173 * ratio / movement1, d);
b9 = reson(driveB, anchor * 4.327 * ratio / movement2, d);

tilt1 = 0.32 + brightness * 0.68;
tilt2 = 0.18 + brightness * 0.82;
groupA = (a1 + a2 + a3 + a4 + a5 * tilt1 + a6 * tilt1 + a7 * tilt2 + a8 * tilt2 + a9 * tilt2) * 0.11;
groupB = (b1 + b2 + b3 + b4 + b5 * tilt1 + b6 * tilt1 + b7 * tilt2 + b8 * tilt2 + b9 * tilt2) * 0.11;

wetL = groupA * (0.8 + space * 0.2) + groupB * (0.7 - space * 0.55);
wetR = groupB * (0.8 + space * 0.2) + groupA * (0.7 - space * 0.55);
wetL = tanh(wetL * (2 + lattice * 4));
wetR = tanh(wetR * (2 + lattice * 4));
g = pow(10, output / 20);
out1 = dcblock(tanh((in1 * (1 - mix) + wetL * mix) * 1.1)) * g;
out2 = dcblock(tanh((in2 * (1 - mix) + wetR * mix) * 1.1)) * g;'''


PARALLAX_CODE = r'''Param width(0.72, min=0, max=1.4);
Param depth(0.48, min=0, max=1);
Param motion(0.31, min=0, max=1);
Param rate(0.17, min=0.005, max=3);
Param skew(0.41, min=0, max=1);
Param rotate(0.22, min=-1, max=1);
Param lowwidth(0.18, min=0, max=1);
Param highwidth(0.82, min=0, max=1);
Param diffusion(0.54, min=0, max=1);
Param monocompat(0.45, min=0, max=1);
Param mix(0.65, min=0, max=1);
Param output(-6, min=-30, max=-1);

Delay d1(9600);
Delay d2(9600);
Delay d3(9600);
Delay d4(9600);
History phase(0);
History lowM(0);
History lowS(0);

phase = wrap(phase + rate / samplerate, 0, 1);
lfo1 = sin(twopi * phase);
lfo2 = sin(twopi * wrap(phase * 1.0625 + 0.317, 0, 1));
lfo3 = sin(twopi * wrap(phase * 1.1666667 + 0.613, 0, 1));

mid = (in1 + in2) * 0.5;
side = (in1 - in2) * 0.5;
pole = exp(-twopi * (170 + skew * 1850) / samplerate);
lowM = mid * (1 - pole) + lowM * pole;
lowS = side * (1 - pole) + lowS * pole;
highM = mid - lowM;
highS = side - lowS;

d1.write(highM + highS * 0.5);
d2.write(highM - highS * 0.5);
d3.write(lowM + lowS * 0.35);
d4.write(lowM - lowS * 0.35);
tap1 = d1.read(samplerate * (0.0017 + depth * (0.006 + motion * 0.012 * (0.5 + 0.5 * lfo1))));
tap2 = d2.read(samplerate * (0.0023 + depth * (0.008 + motion * 0.014 * (0.5 + 0.5 * lfo2))));
tap3 = d3.read(samplerate * (0.0031 + depth * (0.011 + motion * 0.019 * (0.5 + 0.5 * lfo3))));
tap4 = d4.read(samplerate * (0.0041 + depth * (0.013 + motion * 0.017 * (0.5 - 0.5 * lfo1))));

diffHighM = (tap1 + tap2) * 0.5;
diffHighS = (tap1 - tap2) * 0.5;
diffLowM = (tap3 + tap4) * 0.5;
diffLowS = (tap3 - tap4) * 0.5;
wetM = mid + (diffHighM + diffLowM - mid) * diffusion;
wetS = lowS * lowwidth + highS * highwidth;
wetS = wetS + (diffHighS + diffLowS) * diffusion;
wetS = wetS * width * (1 - monocompat * 0.48);

angle = rotate * pi * 0.25 + lfo2 * motion * 0.13;
rotM = wetM * cos(angle) - wetS * sin(angle);
rotS = wetM * sin(angle) + wetS * cos(angle);
wetL = rotM + rotS;
wetR = rotM - rotS;
g = pow(10, output / 20);
out1 = dcblock(tanh((in1 * (1 - mix) + wetL * mix) * 1.08)) * g;
out2 = dcblock(tanh((in2 * (1 - mix) + wetR * mix) * 1.08)) * g;'''


MATTER_CODE = r'''reson(input, frequency, decay) {
    History low(0);
    History band(0);
    f = 2 * sin(pi * clip(frequency, 20, samplerate * 0.43) / samplerate);
    damping = 0.025 + (1 - decay) * 0.31;
    high = input - low - band * damping;
    band = band + f * high;
    low = low + f * band;
    return band;
}

hashvalue(value) {
    h = sin(value * 19.171 + 31.733) * 43758.5453;
    return h - floor(h);
}

Param run(0, min=0, max=1);
Param energy(0.54, min=0, max=1);
Param density(0.48, min=0, max=1);
Param material(0.51, min=0, max=1);
Param decay(0.68, min=0, max=0.98);
Param fracture(0.23, min=0, max=1);
Param rate(0.73, min=0.03, max=8);
Param anchor(92.5, min=30, max=880);
Param relation(0.61, min=0, max=1);
Param friction(0.31, min=0, max=1);
Param space(0.72, min=0, max=1);
Param output(-14, min=-36, max=-1);
Param seed(173, min=1, max=9999);

History phase(0);
History lastphase(0);
History count(0);
History impulse(0);
History pan(0);
History scrape(0);

phase = wrap(phase + rate / samplerate, 0, 1);
tick = phase < lastphase;
lastphase = phase;
if (tick) {
    count = count + 1;
    h1 = hashvalue(count + seed);
    h2 = hashvalue(count * 2.173 + seed * 0.71);
    h3 = hashvalue(count * 3.917 + seed * 1.37);
    if (h1 < density) {
        impulse = energy * (0.35 + h2 * 0.65);
        pan = h3 * 2 - 1;
        scrape = fracture * h2;
    }
}
impulse = impulse * exp(-1 / (samplerate * (0.0012 + material * 0.018)));
scrape = scrape * exp(-1 / (samplerate * (0.008 + friction * 0.24)));
excite = impulse * (1 - material * 0.45) + noise() * scrape * friction;

dr = 1 + relation * 0.122462;
d = decay;
r1 = reson(excite, anchor * 0.503, d);
r2 = reson(excite, anchor * 0.719 * dr, d);
r3 = reson(excite, anchor * 1.000, d);
r4 = reson(excite, anchor * 1.337 / dr, d);
r5 = reson(excite, anchor * 1.618, d);
r6 = reson(excite, anchor * 2.117 * dr, d);
r7 = reson(excite, anchor * 2.719, d);
r8 = reson(excite, anchor * 3.173 / dr, d);
r9 = reson(excite, anchor * 4.327, d);
r10 = reson(excite, anchor * 5.071 * dr, d);
r11 = reson(excite, anchor * 6.913, d);
r12 = reson(excite, anchor * 8.117 / dr, d);

body = (r1 + r2 + r3 + r4 + r5 + r6) * 0.14;
edge = (r7 + r8 + r9 + r10 + r11 + r12) * (0.045 + material * 0.095);
sig = tanh((body + edge) * (1.8 + energy * 4.2));
stereo = space * (0.32 * r5 + 0.21 * r8 - 0.17 * r11);
g = pow(10, output / 20) * run;
out1 = dcblock(tanh(sig * (1 - pan * space * 0.23) + stereo)) * g;
out2 = dcblock(tanh(sig * (1 + pan * space * 0.23) - stereo)) * g;'''


CONDUCTOR_CODE = r'''Param run(0, min=0, max=1);
Param hold(0, min=0, max=1);
Param duration(8, min=1, max=40);
Param intensity(0.68, min=0, max=1);
Param position(0, min=0, max=1);
Param autoposition(1, min=0, max=1);
Param seed(211, min=1, max=9999);

History phase(0);
History slow1(0);
History slow2(0);

if (run > 0.5 && hold < 0.5) {
    phase = wrap(phase + 1 / (samplerate * duration * 60), 0, 1);
}
form = position;
if (autoposition > 0.5) { form = phase; }

slow1 = wrap(slow1 + (0.017 + seed * 0.000001) / samplerate, 0, 1);
slow2 = wrap(slow2 + (0.031 + seed * 0.0000017) / samplerate, 0, 1);
organic = 0.5 + 0.5 * sin(twopi * slow1);
crosswave = 0.5 + 0.5 * sin(twopi * slow2 + sin(twopi * slow1) * 0.8);

field = smoothstep(0, 0.24, form) * (1 - smoothstep(0.38, 0.58, form));
fracturestage = smoothstep(0.29, 0.49, form) * (1 - smoothstep(0.61, 0.75, form));
voidstage = smoothstep(0.58, 0.71, form) * (1 - smoothstep(0.81, 0.91, form));
burststage = smoothstep(0.82, 0.97, form);

memorycontrol = clip((0.24 + field * 0.58 + voidstage * 0.74) * intensity, 0, 1);
fracturecontrol = clip((0.12 + fracturestage * 0.82 + burststage * 0.68) * intensity, 0, 1);
motioncontrol = clip((0.18 + organic * 0.31 + fracturestage * 0.33 + burststage * 0.41) * intensity, 0, 1);
spacecontrol = clip((0.38 + voidstage * 0.49 + crosswave * 0.23) * intensity, 0, 1);
energycontrol = clip((0.21 + field * 0.36 + fracturestage * 0.57 + burststage * 0.76) * intensity, 0, 1);

out1 = in1;
out2 = in2;
out3 = memorycontrol;
out4 = fracturecontrol;
out5 = motioncontrol;
out6 = spacecontrol;
out7 = energycontrol;'''


def app_version():
    return {"major": 8, "minor": 6, "revision": 2, "architecture": "x64", "modernui": 1}


def patcher_base(rect, presentation=False):
    return {
        "fileversion": 1,
        "appversion": app_version(),
        "classnamespace": "box",
        "rect": list(rect),
        "bglocked": 0,
        "openinpresentation": int(presentation),
        "default_fontsize": 10.0,
        "default_fontface": 0,
        "default_fontname": "Ableton Sans Medium Regular",
        "gridonopen": 1,
        "gridsize": [8.0, 8.0],
        "gridsnaponopen": 1,
        "objectsnaponopen": 1,
        "statusbarvisible": 2,
        "toolbarvisible": 1,
        "lefttoolbarpinned": 0,
        "toptoolbarpinned": 0,
        "righttoolbarpinned": 0,
        "bottomtoolbarpinned": 0,
        "toolbars_unpinned_last_save": 0,
        "tallnewobj": 0,
        "boxanimatetime": 200,
        "enablehscroll": 1,
        "enablevscroll": 1,
        "devicewidth": 0.0,
        "description": "",
        "digest": "",
        "tags": "",
        "style": "",
        "subpatcher_template": "",
        "boxes": [],
        "lines": [],
    }


def value_attributes(longname, shortname, minimum, maximum, initial, unitstyle=1, exponent=1.0, steps=0, order=0, info=""):
    return {
        "parameter_units": "",
        "parameter_order": order,
        "parameter_defer": 0,
        "parameter_speedlim": 0.0,
        "parameter_steps": steps,
        "parameter_invisible": 0,
        "parameter_exponent": exponent,
        "parameter_annotation_name": "",
        "parameter_unitstyle": unitstyle,
        "parameter_mmax": float(maximum),
        "parameter_mmin": float(minimum),
        "parameter_initial": [initial],
        "parameter_type": 0,
        "parameter_initial_enable": 1,
        "parameter_shortname": shortname,
        "parameter_modmax": 127.0,
        "parameter_longname": longname,
        "parameter_modmin": 0.0,
        "parameter_linknames": 1,
        "parameter_modmode": 0,
        "parameter_info": info,
    }


def gen_patcher(code, inputs=2, outputs=2):
    p = patcher_base((80.0, 80.0, 980.0, 760.0), False)
    p.pop("classnamespace", None)
    codebox_id = "gen-code"
    p["boxes"].append({"box": {
        "id": codebox_id,
        "maxclass": "codebox",
        "numinlets": inputs,
        "numoutlets": outputs,
        "outlettype": [""] * outputs,
        "patching_rect": [160.0, 24.0, 790.0, 680.0],
        "code": code,
    }})
    for index in range(inputs):
        inlet_id = f"gen-in-{index + 1}"
        p["boxes"].append({"box": {
            "id": inlet_id,
            "maxclass": "newobj",
            "numinlets": 0,
            "numoutlets": 1,
            "outlettype": ["signal"],
            "patching_rect": [24.0, 52.0 + index * 34.0, 42.0, 20.0],
            "text": f"in {index + 1}",
        }})
        p["lines"].append({"patchline": {
            "source": [inlet_id, 0], "destination": [codebox_id, index]
        }})
    for index in range(outputs):
        outlet_id = f"gen-out-{index + 1}"
        p["boxes"].append({"box": {
            "id": outlet_id,
            "maxclass": "newobj",
            "numinlets": 1,
            "numoutlets": 0,
            "patching_rect": [180.0 + index * 92.0, 720.0, 42.0, 20.0],
            "text": f"out {index + 1}",
        }})
        p["lines"].append({"patchline": {
            "source": [codebox_id, index], "destination": [outlet_id, 0]
        }})
    return p


DEVICE_SPECS = [
    {
        "name": "PALIMPSEST",
        "token": "palimpsest",
        "subtitle": "MULTISCALE MEMORY\n4 simultaneous strata",
        "description": "Four-scale recording memory: micro, cloud, memory and fossil layers.",
        "digest": "A continuously recording palimpsest with reverse drift, stereo displacement and regenerative strata.",
        "type": AUDIO_EFFECT,
        "accent": [0.98, 0.42, 0.65, 1.0],
        "code": PALIMPSEST_CODE,
        "controls": [
            ("Capture", "Capture", "capture", 0, 1, 1, 5, 1, 0, "Continuous recording amount."),
            ("Micro", "Micro", "micro", 0, 1, 0.48, 5, 1, 0, "37–171 ms memory stratum."),
            ("Cloud", "Cloud", "cloud", 0, 1, 0.42, 5, 1, 0, "0.2–2 second memory stratum."),
            ("Memory", "Memory", "memory", 0, 1, 0.38, 5, 1, 0, "3–12 second memory stratum."),
            ("Fossil", "Fossil", "fossil", 0, 1, 0.25, 5, 1, 0, "Slow accumulated residue."),
            ("Density", "Density", "density", 0, 1, 0.62, 5, 1, 0, "Activity within all memory strata."),
            ("Reverse", "Reverse", "reverse", 0, 1, 0.18, 5, 1, 0, "Chance of backward memory motion."),
            ("Motion", "Motion", "motion", 0, 1, 0.34, 5, 1, 0, "Read-head movement across scales."),
            ("Feedback", "Feedback", "feedback", 0, 0.88, 0.28, 5, 1, 0, "Cross-channel regenerative memory."),
            ("Space", "Space", "space", 0, 1, 0.72, 5, 1, 0, "Stereo temporal displacement."),
            ("Mix", "Mix", "mix", 0, 1, 0.58, 5, 1, 0, "Dry/wet balance."),
            ("Output", "Output", "output", -30, -1, -8, 4, 1, 0, "Output level in dB."),
            ("Seed", "Seed", "seed", 1, 9999, 71, 0, 1, 9999, "Deterministic memory geometry."),
        ],
    },
    {
        "name": "MONTAGE MEMORY",
        "token": "montage",
        "subtitle": "STRUCTURAL RECALL\nfragments with ancestry",
        "description": "A history-aware fragment recombination and repetition effect.",
        "digest": "Record, recall, repeat, reverse and fracture current material against its own earlier states.",
        "type": AUDIO_EFFECT,
        "accent": [1.0, 0.59, 0.22, 1.0],
        "code": MONTAGE_CODE,
        "controls": [
            ("Capture", "Capture", "capture", 0, 1, 1, 5, 1, 0, "Continuous recording amount."),
            ("Fragment", "Fragment", "fragment", 0, 1, 0.42, 5, 1, 0, "Fragment duration range."),
            ("History", "History", "history", 0, 1, 0.44, 5, 1, 0, "Reach and level of older material."),
            ("Repeat", "Repeat", "repeat", 0, 1, 0.35, 5, 1, 0, "Fragment repetition and persistence."),
            ("Reverse", "Reverse", "reverse", 0, 1, 0.21, 5, 1, 0, "Backward fragment probability."),
            ("Fracture", "Fracture", "fracture", 0, 1, 0.32, 5, 1, 0, "Hard edits and bounded microcuts."),
            ("Rate", "Rate", "rate", 0.01, 2, 0.37, 3, 2, 0, "Event and playback activity."),
            ("Density", "Density", "density", 0, 1, 0.66, 5, 1, 0, "Probability of new fragments."),
            ("Space", "Space", "space", 0, 1, 0.62, 5, 1, 0, "Stereo memory divergence."),
            ("Feedback", "Feedback", "feedback", 0, 0.75, 0.16, 5, 1, 0, "Regenerative fragment capture."),
            ("Mix", "Mix", "mix", 0, 1, 0.54, 5, 1, 0, "Dry/wet balance."),
            ("Output", "Output", "output", -30, -1, -8, 4, 1, 0, "Output level in dB."),
            ("Seed", "Seed", "seed", 1, 9999, 113, 0, 1, 9999, "Deterministic edit decisions."),
        ],
    },
    {
        "name": "SPECTRAL LATTICE",
        "token": "lattice",
        "subtitle": "COUPLED RESONANCE\n18 inharmonic nodes",
        "description": "An 18-node inharmonic resonant lattice with cross-coupled groups.",
        "digest": "Turns impulses, speech and percussion into moving, interdependent resonant structures.",
        "type": AUDIO_EFFECT,
        "accent": [0.38, 0.92, 0.98, 1.0],
        "code": LATTICE_CODE,
        "controls": [
            ("Excite", "Excite", "excite", 0, 1, 0.55, 5, 1, 0, "Input excitation amount."),
            ("Lattice", "Lattice", "lattice", 0, 1, 0.58, 5, 1, 0, "Resonant saturation and prominence."),
            ("Coupling", "Coupling", "coupling", 0, 0.78, 0.24, 5, 1, 0, "Cross-coupling between node groups."),
            ("Decay", "Decay", "decay", 0, 0.995, 0.72, 5, 1, 0, "Resonant persistence."),
            ("Drift", "Drift", "drift", 0, 1, 0.21, 5, 1, 0, "Slow frequency motion."),
            ("Anchor", "Anchor", "anchor", 80, 2200, 553.71, 3, 2.3, 0, "Central lattice frequency."),
            ("Relation", "Relation", "relation", 0, 1, 0.62, 5, 1, 0, "Offset between resonant groups."),
            ("Brightness", "Bright", "brightness", 0, 1, 0.61, 5, 1, 0, "Upper-node contribution."),
            ("Space", "Space", "space", 0, 1, 0.78, 5, 1, 0, "Group separation in stereo."),
            ("Freeze", "Freeze", "freeze", 0, 1, 0, 5, 1, 0, "Extends the current resonant field."),
            ("Mix", "Mix", "mix", 0, 1, 0.56, 5, 1, 0, "Dry/wet balance."),
            ("Output", "Output", "output", -30, -1, -10, 4, 1, 0, "Output level in dB."),
        ],
    },
    {
        "name": "PARALLAX",
        "token": "parallax",
        "subtitle": "FIELD DISPLACEMENT\nfrequency-dependent stereo",
        "description": "A moving, frequency-dependent stereo displacement field.",
        "digest": "Short asymmetric delays, multiband width and mid/side rotation without total mono collapse.",
        "type": AUDIO_EFFECT,
        "accent": [0.59, 0.48, 1.0, 1.0],
        "code": PARALLAX_CODE,
        "controls": [
            ("Width", "Width", "width", 0, 1.4, 0.72, 5, 1, 0, "Overall stereo width."),
            ("Depth", "Depth", "depth", 0, 1, 0.48, 5, 1, 0, "Temporal displacement depth."),
            ("Motion", "Motion", "motion", 0, 1, 0.31, 5, 1, 0, "Modulation depth."),
            ("Rate", "Rate", "rate", 0.005, 3, 0.17, 3, 2.3, 0, "Modulation speed."),
            ("Skew", "Skew", "skew", 0, 1, 0.41, 5, 1, 0, "Frequency split geometry."),
            ("Rotate", "Rotate", "rotate", -1, 1, 0.22, 5, 1, 0, "Mid/side field rotation."),
            ("Low Width", "Low", "lowwidth", 0, 1, 0.18, 5, 1, 0, "Low-frequency spread."),
            ("High Width", "High", "highwidth", 0, 1, 0.82, 5, 1, 0, "High-frequency spread."),
            ("Diffusion", "Diffuse", "diffusion", 0, 1, 0.54, 5, 1, 0, "Decorrelated tap contribution."),
            ("Mono Safe", "MonoSafe", "monocompat", 0, 1, 0.45, 5, 1, 0, "Retains a stable mono centre."),
            ("Mix", "Mix", "mix", 0, 1, 0.65, 5, 1, 0, "Dry/wet balance."),
            ("Output", "Output", "output", -30, -1, -6, 4, 1, 0, "Output level in dB."),
        ],
    },
    {
        "name": "RESONANT MATTER",
        "token": "matter",
        "subtitle": "MATERIAL EXCITATION\nno oscillator melody",
        "description": "A self-exciting inharmonic material and percussion instrument.",
        "digest": "Noise, impulse and friction excite twelve related resonant bodies without conventional melody.",
        "type": INSTRUMENT,
        "accent": [0.73, 0.98, 0.42, 1.0],
        "code": MATTER_CODE,
        "toggle": ("RUN", "Run", "run", 0, "Starts the material excitation engine."),
        "controls": [
            ("Energy", "Energy", "energy", 0, 1, 0.54, 5, 1, 0, "Excitation intensity."),
            ("Density", "Density", "density", 0, 1, 0.48, 5, 1, 0, "Probability of material events."),
            ("Material", "Material", "material", 0, 1, 0.51, 5, 1, 0, "Impulse hardness and overtone balance."),
            ("Decay", "Decay", "decay", 0, 0.98, 0.68, 5, 1, 0, "Body resonance persistence."),
            ("Fracture", "Fracture", "fracture", 0, 1, 0.23, 5, 1, 0, "Scrape and unstable excitation."),
            ("Rate", "Rate", "rate", 0.03, 8, 0.73, 3, 2.2, 0, "Event clock rate."),
            ("Anchor", "Anchor", "anchor", 30, 880, 92.5, 3, 2.3, 0, "Lowest resonant anchor."),
            ("Relation", "Relation", "relation", 0, 1, 0.61, 5, 1, 0, "Inharmonic relationship field."),
            ("Friction", "Friction", "friction", 0, 1, 0.31, 5, 1, 0, "Noise scrape excitation."),
            ("Space", "Space", "space", 0, 1, 0.72, 5, 1, 0, "Stereo body displacement."),
            ("Output", "Output", "output", -36, -1, -14, 4, 1, 0, "Output level in dB."),
            ("Seed", "Seed", "seed", 1, 9999, 173, 0, 1, 9999, "Deterministic event identity."),
        ],
    },
]


def add_project_metadata(p, device_type):
    p["dependency_cache"] = []
    p["latency"] = 0
    p["project"] = {
        "version": 1,
        "creationdate": 3848900000,
        "modificationdate": 3848900000,
        "viewrect": [0.0, 0.0, 300.0, 500.0],
        "autoorganize": 1,
        "hideprojectwindow": 1,
        "showdependencies": 1,
        "autolocalize": 0,
        "contents": {"patchers": {}},
        "layout": {},
        "searchpath": {},
        "detailsvisible": 0,
        "amxdtype": device_type,
        "readonly": 0,
        "devpathtype": 0,
        "devpath": ".",
        "sortmode": 0,
        "viewmode": 0,
    }
    p["autosave"] = 0


def build_device(spec):
    p = patcher_base((90.0, 90.0, 1180.0, 720.0), True)
    p.update({
        "openrect": [0.0, 0.0, 1100.0, 169.0],
        "devicewidth": 1100.0,
        "description": spec["description"],
        "digest": spec["digest"],
        "tags": "experimental layering memory spectral stereo max for live",
        "title": spec["name"],
    })
    boxes = p["boxes"]
    lines = p["lines"]
    parameters = {}
    parameter_ids = []
    object_number = 1

    def oid(label):
        nonlocal object_number
        result = f"obj-{object_number}-{label}"
        object_number += 1
        return result

    def add(box):
        boxes.append({"box": box})

    title_id = oid("title")
    add({
        "id": title_id, "maxclass": "live.comment", "numinlets": 1, "numoutlets": 0,
        "patching_rect": [18.0, 18.0, 122.0, 20.0], "presentation": 1,
        "presentation_rect": [11.0, 12.0, 132.0, 22.0], "text": spec["name"],
        "fontsize": 12.0, "fontface": 1, "textcolor": spec["accent"],
    })
    add({
        "id": oid("subtitle"), "maxclass": "live.comment", "numinlets": 1, "numoutlets": 0,
        "patching_rect": [18.0, 45.0, 125.0, 48.0], "presentation": 1,
        "presentation_rect": [11.0, 38.0, 132.0, 48.0], "text": spec["subtitle"],
        "fontsize": 8.5, "textcolor": [0.68, 0.72, 0.8, 1.0], "linecount": 2,
    })
    add({
        "id": oid("buslabel"), "maxclass": "live.comment", "numinlets": 1, "numoutlets": 0,
        "patching_rect": [18.0, 105.0, 125.0, 36.0], "presentation": 1,
        "presentation_rect": [11.0, 119.0, 132.0, 32.0],
        "text": "FIELD BUS READY\nindependent / linked", "fontsize": 8.0,
        "textcolor": [0.48, 0.54, 0.64, 1.0], "linecount": 2,
    })

    inputs = 1 if spec["type"] == INSTRUMENT else 2
    gen_id = oid("gen")
    add({
        "id": gen_id, "maxclass": "newobj", "numinlets": inputs, "numoutlets": 2,
        "outlettype": ["signal", "signal"], "patching_rect": [430.0, 480.0, 50.0, 22.0],
        "text": "gen~", "patcher": gen_patcher(spec["code"], inputs, 2),
        "saved_object_attributes": {"description": "", "digest": "", "globalpatchername": "", "tags": ""},
    })
    if spec["type"] == AUDIO_EFFECT:
        plugin_id = oid("plugin")
        add({
            "id": plugin_id, "maxclass": "newobj", "numinlets": 2, "numoutlets": 2,
            "outlettype": ["signal", "signal"], "patching_rect": [330.0, 430.0, 52.0, 22.0],
            "text": "plugin~",
        })
        lines += [
            {"patchline": {"source": [plugin_id, 0], "destination": [gen_id, 0]}},
            {"patchline": {"source": [plugin_id, 1], "destination": [gen_id, 1]}},
        ]
    plugout_id = oid("plugout")
    add({
        "id": plugout_id, "maxclass": "newobj", "numinlets": 2, "numoutlets": 2,
        "outlettype": ["signal", "signal"], "patching_rect": [430.0, 550.0, 58.0, 22.0],
        "text": "plugout~",
    })
    lines += [
        {"patchline": {"source": [gen_id, 0], "destination": [plugout_id, 0]}},
        {"patchline": {"source": [gen_id, 1], "destination": [plugout_id, 1]}},
    ]

    scope_id = oid("scope")
    add({
        "id": scope_id, "maxclass": "scope~", "numinlets": 2, "numoutlets": 0,
        "patching_rect": [850.0, 420.0, 215.0, 88.0], "presentation": 1,
        "presentation_rect": [908.0, 22.0, 177.0, 91.0], "bufsize": 256,
        "calccount": 64, "fgcolor": spec["accent"],
        "bgcolor": [0.025, 0.029, 0.042, 1.0], "rounded": 0,
    })
    lines += [
        {"patchline": {"source": [gen_id, 0], "destination": [scope_id, 0]}},
        {"patchline": {"source": [gen_id, 1], "destination": [scope_id, 1]}},
    ]
    add({
        "id": oid("scopecomment"), "maxclass": "live.comment", "numinlets": 1, "numoutlets": 0,
        "patching_rect": [850.0, 515.0, 215.0, 18.0], "presentation": 1,
        "presentation_rect": [908.0, 119.0, 177.0, 18.0], "text": "FIELD OUTPUT / stereo",
        "fontsize": 8.5, "textcolor": [0.55, 0.59, 0.68, 1.0], "textjustification": 1,
    })

    def add_message_control(ui_id, message_name, order):
        msg_id = oid(f"msg-{message_name}")
        add({
            "id": msg_id, "maxclass": "message", "numinlets": 2, "numoutlets": 1,
            "outlettype": [""], "patching_rect": [570.0, 250.0 + order * 22.0, 92.0, 20.0],
            "text": f"{message_name} $1",
        })
        lines.append({"patchline": {"source": [ui_id, 0], "destination": [msg_id, 0]}})
        lines.append({"patchline": {"source": [msg_id, 0], "destination": [gen_id, 0]}})

    order_offset = 0
    toggle = spec.get("toggle")
    if toggle:
        name, short, message_name, initial, annotation = toggle
        ui_id = oid(message_name)
        add({
            "id": ui_id, "maxclass": "live.text", "numinlets": 1, "numoutlets": 2,
            "outlettype": ["", ""], "patching_rect": [20.0, 250.0, 90.0, 22.0],
            "presentation": 1, "presentation_rect": [21.0, 88.0, 112.0, 22.0],
            "text": f"{name} OFF", "texton": f"{name} ON", "automation": "off", "automationon": "on",
            "activebgoncolor": spec["accent"], "activebgcolor": [0.13, 0.15, 0.2, 1.0],
            "textoncolor": [0.02, 0.04, 0.05, 1.0], "textcolor": [0.72, 0.76, 0.83, 1.0],
            "parameter_enable": 1, "varname": message_name, "annotation": annotation,
            "saved_attribute_attributes": {"valueof": {
                "parameter_units": "", "parameter_order": 0, "parameter_defer": 0,
                "parameter_speedlim": 0.0, "parameter_steps": 0, "parameter_invisible": 0,
                "parameter_enum": ["off", "on"], "parameter_exponent": 1.0,
                "parameter_annotation_name": "", "parameter_unitstyle": 10,
                "parameter_mmax": 1.0, "parameter_mmin": 0.0, "parameter_initial": [initial],
                "parameter_type": 2, "parameter_initial_enable": 1,
                "parameter_shortname": short, "parameter_modmax": 127.0,
                "parameter_longname": name, "parameter_modmin": 0.0,
                "parameter_linknames": 1, "parameter_modmode": 0, "parameter_info": annotation,
            }},
        })
        parameters[ui_id] = [name, short, 0]
        parameter_ids.append(ui_id)
        add_message_control(ui_id, message_name, 0)
        order_offset = 1

    controls = spec["controls"]
    available_width = 744.0
    columns = min(9, max(6, (len(controls) + 1) // 2))
    spacing = available_width / columns
    for index, control in enumerate(controls):
        longname, shortname, message_name, minimum, maximum, initial, unitstyle, exponent, steps, annotation = control
        row = index // columns
        col = index % columns
        x = 151.0 + col * spacing
        y = 8.0 + row * 79.0
        ui_id = oid(message_name)
        add({
            "id": ui_id, "maxclass": "live.dial", "numinlets": 1, "numoutlets": 2,
            "outlettype": ["", "float"], "patching_rect": [160.0 + index * 6.0, 250.0 + index * 22.0, 44.0, 47.0],
            "presentation": 1, "presentation_rect": [x + 14.0, y, 44.0, 47.0],
            "parameter_enable": 1, "varname": message_name, "annotation": annotation,
            "saved_attribute_attributes": {"valueof": value_attributes(
                longname, shortname, minimum, maximum, initial, unitstyle, exponent, steps, index + order_offset, annotation
            )},
        })
        add({
            "id": oid(f"label-{message_name}"), "maxclass": "live.comment", "numinlets": 1, "numoutlets": 0,
            "patching_rect": [160.0 + index * 6.0, 280.0 + index * 22.0, 72.0, 16.0],
            "presentation": 1, "presentation_rect": [x, y + 48.0, 72.0, 16.0],
            "text": shortname, "textjustification": 1, "fontsize": 8.7,
            "textcolor": [0.7, 0.74, 0.82, 1.0],
        })
        parameters[ui_id] = [longname, shortname, 0]
        parameter_ids.append(ui_id)
        add_message_control(ui_id, message_name, index + order_offset)

    receiver_id = oid("field-receiver")
    route_id = oid("field-route")
    add({
        "id": receiver_id, "maxclass": "newobj", "numinlets": 0, "numoutlets": 1,
        "outlettype": [""], "patching_rect": [730.0, 470.0, 66.0, 20.0], "text": "r EP_FIELD",
    })
    add({
        "id": route_id, "maxclass": "newobj", "numinlets": 1, "numoutlets": 2,
        "outlettype": ["", ""], "patching_rect": [730.0, 505.0, 110.0, 20.0],
        "text": f"route {spec['token']}",
    })
    lines += [
        {"patchline": {"source": [receiver_id, 0], "destination": [route_id, 0]}},
        {"patchline": {"source": [route_id, 0], "destination": [gen_id, 0]}},
    ]

    loadbang_id = oid("loadbang")
    defaults_id = oid("defaults")
    defaults = []
    if toggle:
        defaults.append(f"{toggle[2]} {toggle[3]}")
    defaults.extend(f"{c[2]} {c[5]}" for c in controls)
    add({
        "id": loadbang_id, "maxclass": "newobj", "numinlets": 1, "numoutlets": 1,
        "outlettype": ["bang"], "patching_rect": [730.0, 555.0, 58.0, 20.0], "text": "loadbang",
    })
    add({
        "id": defaults_id, "maxclass": "message", "numinlets": 2, "numoutlets": 1,
        "outlettype": [""], "patching_rect": [730.0, 590.0, 390.0, 44.0],
        "text": ", ".join(defaults), "linecount": 2,
    })
    lines += [
        {"patchline": {"source": [loadbang_id, 0], "destination": [defaults_id, 0]}},
        {"patchline": {"source": [defaults_id, 0], "destination": [gen_id, 0]}},
    ]

    # Max presentation order is front-to-back: panels must be appended last.
    add({
        "id": oid("titlepanel"), "maxclass": "panel", "numinlets": 1, "numoutlets": 0,
        "patching_rect": [8.0, 8.0, 140.0, 153.0], "presentation": 1,
        "presentation_rect": [0.0, 0.0, 148.0, 169.0],
        "bgcolor": [0.075, 0.086, 0.12, 1.0], "border": 0, "rounded": 0,
    })
    add({
        "id": oid("background"), "maxclass": "panel", "numinlets": 1, "numoutlets": 0,
        "patching_rect": [8.0, 8.0, 1084.0, 153.0], "presentation": 1,
        "presentation_rect": [0.0, 0.0, 1100.0, 169.0],
        "bgcolor": [0.043, 0.051, 0.071, 1.0], "border": 0, "rounded": 0,
    })

    p["parameters"] = parameters
    p["parameterbanks"] = {}
    for bank_index in range(0, len(parameter_ids), 8):
        bank_number = bank_index // 8
        p["parameterbanks"][str(bank_number)] = {
            "index": bank_number,
            "name": f"Bank {bank_number + 1}",
            "parameters": parameter_ids[bank_index:bank_index + 8],
        }
    add_project_metadata(p, spec["type"])
    return {"patcher": p}


def build_conductor():
    spec = {
        "name": "FIELD CONDUCTOR",
        "token": "conductor",
        "subtitle": "MACRO FORM ENGINE\ncontinuous / fracture / void / burst",
        "description": "A pass-through four-stage form engine broadcasting linked controls to the suite.",
        "digest": "Conducts long-form changes across the Emergent Properties suite through a global Max control bus.",
        "type": AUDIO_EFFECT,
        "accent": [1.0, 0.84, 0.31, 1.0],
        "code": CONDUCTOR_CODE,
        "controls": [],
    }
    p = patcher_base((90.0, 90.0, 1180.0, 760.0), True)
    p.update({
        "openrect": [0.0, 0.0, 1100.0, 169.0], "devicewidth": 1100.0,
        "description": spec["description"], "digest": spec["digest"],
        "tags": "experimental form conductor macro max for live", "title": spec["name"],
    })
    boxes, lines = p["boxes"], p["lines"]
    parameters, parameter_ids = {}, []
    object_number = 1

    def oid(label):
        nonlocal object_number
        result = f"obj-{object_number}-{label}"
        object_number += 1
        return result

    def add(box):
        boxes.append({"box": box})

    add({"id": oid("title"), "maxclass": "live.comment", "numinlets": 1, "numoutlets": 0,
         "patching_rect": [18.0, 18.0, 126.0, 20.0], "presentation": 1,
         "presentation_rect": [11.0, 12.0, 132.0, 22.0], "text": "FIELD CONDUCTOR",
         "fontsize": 12.0, "fontface": 1, "textcolor": spec["accent"]})
    add({"id": oid("subtitle"), "maxclass": "live.comment", "numinlets": 1, "numoutlets": 0,
         "patching_rect": [18.0, 45.0, 125.0, 48.0], "presentation": 1,
         "presentation_rect": [11.0, 38.0, 132.0, 48.0], "text": spec["subtitle"],
         "fontsize": 8.2, "textcolor": [0.68, 0.72, 0.8, 1.0], "linecount": 2})
    add({"id": oid("buslabel"), "maxclass": "live.comment", "numinlets": 1, "numoutlets": 0,
         "patching_rect": [18.0, 110.0, 125.0, 32.0], "presentation": 1,
         "presentation_rect": [11.0, 119.0, 132.0, 32.0], "text": "BROADCAST: EP_FIELD\ninsert anywhere in Set",
         "fontsize": 8.0, "textcolor": [0.48, 0.54, 0.64, 1.0], "linecount": 2})

    gen_id = oid("gen")
    add({"id": gen_id, "maxclass": "newobj", "numinlets": 2, "numoutlets": 7,
         "outlettype": ["signal"] * 7, "patching_rect": [390.0, 410.0, 118.0, 22.0],
         "text": "gen~", "patcher": gen_patcher(CONDUCTOR_CODE, 2, 7),
         "saved_object_attributes": {"description": "", "digest": "", "globalpatchername": "", "tags": ""}})
    plugin_id = oid("plugin")
    plugout_id = oid("plugout")
    add({"id": plugin_id, "maxclass": "newobj", "numinlets": 2, "numoutlets": 2,
         "outlettype": ["signal", "signal"], "patching_rect": [280.0, 410.0, 52.0, 22.0], "text": "plugin~"})
    add({"id": plugout_id, "maxclass": "newobj", "numinlets": 2, "numoutlets": 2,
         "outlettype": ["signal", "signal"], "patching_rect": [390.0, 470.0, 58.0, 22.0], "text": "plugout~"})
    lines += [
        {"patchline": {"source": [plugin_id, 0], "destination": [gen_id, 0]}},
        {"patchline": {"source": [plugin_id, 1], "destination": [gen_id, 1]}},
        {"patchline": {"source": [gen_id, 0], "destination": [plugout_id, 0]}},
        {"patchline": {"source": [gen_id, 1], "destination": [plugout_id, 1]}},
    ]

    def add_param(control, x, order):
        longname, shortname, message_name, minimum, maximum, initial, unitstyle, exponent, steps, annotation = control
        ui_id = oid(message_name)
        add({"id": ui_id, "maxclass": "live.dial", "numinlets": 1, "numoutlets": 2,
             "outlettype": ["", "float"], "patching_rect": [160.0 + order * 65.0, 260.0, 44.0, 47.0],
             "presentation": 1, "presentation_rect": [x + 14.0, 24.0, 44.0, 47.0],
             "parameter_enable": 1, "varname": message_name, "annotation": annotation,
             "saved_attribute_attributes": {"valueof": value_attributes(
                 longname, shortname, minimum, maximum, initial, unitstyle, exponent, steps, order + 2, annotation)}})
        add({"id": oid(f"label-{message_name}"), "maxclass": "live.comment", "numinlets": 1, "numoutlets": 0,
             "patching_rect": [160.0 + order * 65.0, 310.0, 72.0, 16.0], "presentation": 1,
             "presentation_rect": [x, 73.0, 72.0, 16.0], "text": shortname,
             "textjustification": 1, "fontsize": 8.7, "textcolor": [0.7, 0.74, 0.82, 1.0]})
        msg_id = oid(f"msg-{message_name}")
        add({"id": msg_id, "maxclass": "message", "numinlets": 2, "numoutlets": 1,
             "outlettype": [""], "patching_rect": [600.0, 260.0 + order * 24.0, 102.0, 20.0],
             "text": f"{message_name} $1"})
        lines.extend([
            {"patchline": {"source": [ui_id, 0], "destination": [msg_id, 0]}},
            {"patchline": {"source": [msg_id, 0], "destination": [gen_id, 0]}},
        ])
        parameters[ui_id] = [longname, shortname, 0]
        parameter_ids.append(ui_id)

    toggles = [
        ("RUN", "Run", "run", 0, "Runs the form timeline."),
        ("HOLD", "Hold", "hold", 0, "Pauses the timeline at its current state."),
    ]
    for index, (name, short, message_name, initial, annotation) in enumerate(toggles):
        ui_id = oid(message_name)
        add({"id": ui_id, "maxclass": "live.text", "numinlets": 1, "numoutlets": 2,
             "outlettype": ["", ""], "patching_rect": [20.0 + index * 95.0, 260.0, 86.0, 22.0],
             "presentation": 1, "presentation_rect": [166.0 + index * 100.0, 112.0, 90.0, 22.0],
             "text": f"{name} OFF", "texton": f"{name} ON", "automation": "off", "automationon": "on",
             "activebgoncolor": spec["accent"], "activebgcolor": [0.13, 0.15, 0.2, 1.0],
             "textoncolor": [0.02, 0.04, 0.05, 1.0], "textcolor": [0.72, 0.76, 0.83, 1.0],
             "parameter_enable": 1, "varname": message_name, "annotation": annotation,
             "saved_attribute_attributes": {"valueof": {
                 "parameter_units": "", "parameter_order": index, "parameter_defer": 0,
                 "parameter_speedlim": 0.0, "parameter_steps": 0, "parameter_invisible": 0,
                 "parameter_enum": ["off", "on"], "parameter_exponent": 1.0,
                 "parameter_annotation_name": "", "parameter_unitstyle": 10,
                 "parameter_mmax": 1.0, "parameter_mmin": 0.0, "parameter_initial": [initial],
                 "parameter_type": 2, "parameter_initial_enable": 1,
                 "parameter_shortname": short, "parameter_modmax": 127.0,
                 "parameter_longname": name, "parameter_modmin": 0.0,
                 "parameter_linknames": 1, "parameter_modmode": 0, "parameter_info": annotation}}})
        msg_id = oid(f"msg-{message_name}")
        add({"id": msg_id, "maxclass": "message", "numinlets": 2, "numoutlets": 1,
             "outlettype": [""], "patching_rect": [600.0, 210.0 + index * 24.0, 80.0, 20.0],
             "text": f"{message_name} $1"})
        lines += [
            {"patchline": {"source": [ui_id, 0], "destination": [msg_id, 0]}},
            {"patchline": {"source": [msg_id, 0], "destination": [gen_id, 0]}},
        ]
        parameters[ui_id] = [name, short, 0]
        parameter_ids.append(ui_id)

    control_specs = [
        ("Duration", "Minutes", "duration", 1, 40, 8, 0, 1.8, 40, "Full form-cycle length in minutes."),
        ("Intensity", "Intensity", "intensity", 0, 1, 0.68, 5, 1, 0, "Global depth of the conducted changes."),
        ("Position", "Position", "position", 0, 1, 0, 5, 1, 0, "Manual form position."),
        ("Auto Position", "Auto", "autoposition", 0, 1, 1, 0, 1, 2, "Uses the internal timeline instead of Position."),
        ("Seed", "Seed", "seed", 1, 9999, 211, 0, 1, 9999, "Identity of the slow control trajectories."),
    ]
    for index, control in enumerate(control_specs):
        add_param(control, 327.0 + index * 91.0, index)

    send_id = oid("field-send")
    add({"id": send_id, "maxclass": "newobj", "numinlets": 1, "numoutlets": 0,
         "patching_rect": [990.0, 610.0, 65.0, 20.0], "text": "s EP_FIELD"})
    mappings = {
        2: [("palimpsest", "memory"), ("palimpsest", "fossil"), ("montage", "history"), ("lattice", "decay")],
        3: [("montage", "fracture"), ("montage", "reverse"), ("lattice", "coupling"), ("matter", "fracture")],
        4: [("palimpsest", "motion"), ("palimpsest", "density"), ("lattice", "drift"), ("parallax", "motion")],
        5: [("palimpsest", "space"), ("parallax", "width"), ("parallax", "diffusion"), ("matter", "space")],
        6: [("matter", "energy"), ("matter", "density"), ("montage", "density"), ("lattice", "lattice")],
    }
    for outlet, targets in mappings.items():
        snap_id = oid(f"snapshot-{outlet}")
        add({"id": snap_id, "maxclass": "newobj", "numinlets": 2, "numoutlets": 1,
             "outlettype": ["float"], "patching_rect": [530.0 + outlet * 22.0, 475.0 + outlet * 18.0, 82.0, 20.0],
             "text": "snapshot~ 100"})
        lines.append({"patchline": {"source": [gen_id, outlet], "destination": [snap_id, 0]}})
        for target, parameter in targets:
            message_id = oid(f"broadcast-{target}-{parameter}")
            add({"id": message_id, "maxclass": "message", "numinlets": 2, "numoutlets": 1,
                 "outlettype": [""], "patching_rect": [700.0, 400.0 + object_number * 4.0, 180.0, 20.0],
                 "text": f"{target} {parameter} $1"})
            lines += [
                {"patchline": {"source": [snap_id, 0], "destination": [message_id, 0]}},
                {"patchline": {"source": [message_id, 0], "destination": [send_id, 0]}},
            ]

    loadbang_id = oid("loadbang")
    defaults_id = oid("defaults")
    add({"id": loadbang_id, "maxclass": "newobj", "numinlets": 1, "numoutlets": 1,
         "outlettype": ["bang"], "patching_rect": [850.0, 220.0, 58.0, 20.0], "text": "loadbang"})
    add({"id": defaults_id, "maxclass": "message", "numinlets": 2, "numoutlets": 1,
         "outlettype": [""], "patching_rect": [850.0, 255.0, 260.0, 42.0],
         "text": "run 0, hold 0, duration 8, intensity 0.68, position 0, autoposition 1, seed 211", "linecount": 2})
    lines += [
        {"patchline": {"source": [loadbang_id, 0], "destination": [defaults_id, 0]}},
        {"patchline": {"source": [defaults_id, 0], "destination": [gen_id, 0]}},
    ]

    stage_colors = [
        ("CONTINUOUS", 166.0, [0.35, 0.78, 0.92, 1.0]),
        ("FRACTURE", 366.0, [1.0, 0.48, 0.31, 1.0]),
        ("VOID", 566.0, [0.62, 0.48, 0.91, 1.0]),
        ("BURST", 766.0, [0.98, 0.84, 0.31, 1.0]),
    ]
    for label, x, color in stage_colors:
        add({"id": oid(f"stage-{label}"), "maxclass": "live.comment", "numinlets": 1, "numoutlets": 0,
             "patching_rect": [x, 340.0, 160.0, 18.0], "presentation": 1,
             "presentation_rect": [x, 142.0, 160.0, 18.0], "text": label,
             "fontsize": 8.4, "fontface": 1, "textcolor": color, "textjustification": 1})

    add({"id": oid("titlepanel"), "maxclass": "panel", "numinlets": 1, "numoutlets": 0,
         "patching_rect": [8.0, 8.0, 140.0, 153.0], "presentation": 1,
         "presentation_rect": [0.0, 0.0, 148.0, 169.0],
         "bgcolor": [0.075, 0.086, 0.12, 1.0], "border": 0, "rounded": 0})
    add({"id": oid("background"), "maxclass": "panel", "numinlets": 1, "numoutlets": 0,
         "patching_rect": [8.0, 8.0, 1084.0, 153.0], "presentation": 1,
         "presentation_rect": [0.0, 0.0, 1100.0, 169.0],
         "bgcolor": [0.043, 0.051, 0.071, 1.0], "border": 0, "rounded": 0})

    p["parameters"] = parameters
    p["parameterbanks"] = {
        "0": {"index": 0, "name": "Form", "parameters": parameter_ids[:8]},
        "1": {"index": 1, "name": "Form 2", "parameters": parameter_ids[8:16]},
    }
    add_project_metadata(p, AUDIO_EFFECT)
    return {"patcher": p}


def write_amxd(path, patch_document):
    payload = (json.dumps(patch_document, indent=2, ensure_ascii=False) + "\n\x00").encode("utf-8")
    header = b"ampf" + struct.pack("<I", 4) + b"iiii"
    header += b"meta" + struct.pack("<I", 4) + b"\x00\x00\x00\x00"
    header += b"ptch" + struct.pack("<I", len(payload))
    path.write_bytes(header + payload)


def validator_patcher(name, code, inputs, outputs, defaults, render_path):
    """Runtime harness proving that a device's embedded Gen DSP compiles and emits audio."""
    p = patcher_base((120.0, 120.0, 900.0, 620.0), False)
    gen_id = "validate-gen"
    p["boxes"] += [
        {"box": {
            "id": gen_id, "maxclass": "newobj", "numinlets": inputs, "numoutlets": outputs,
            "outlettype": ["signal"] * outputs, "patching_rect": [330.0, 210.0, 88.0, 22.0],
            "text": "gen~", "patcher": gen_patcher(code, inputs, outputs),
        }},
        {"box": {
            "id": "validate-loadbang", "maxclass": "newobj", "numinlets": 1, "numoutlets": 1,
            "outlettype": ["bang"], "patching_rect": [28.0, 28.0, 58.0, 22.0], "text": "loadbang",
        }},
        {"box": {
            "id": "validate-defaults", "maxclass": "message", "numinlets": 2, "numoutlets": 1,
            "outlettype": [""], "patching_rect": [115.0, 28.0, 520.0, 42.0],
            "text": defaults, "linecount": 2,
        }},
        {"box": {
            "id": "validate-driver", "maxclass": "message", "numinlets": 2, "numoutlets": 1,
            "outlettype": [""], "patching_rect": [28.0, 80.0, 170.0, 22.0],
            "text": "; dsp setdriver NonRealTime",
        }},
        {"box": {
            "id": "validate-start-delay", "maxclass": "newobj", "numinlets": 2, "numoutlets": 1,
            "outlettype": ["bang"], "patching_rect": [230.0, 80.0, 62.0, 22.0], "text": "delay 250",
        }},
        {"box": {
            "id": "validate-dsp", "maxclass": "message", "numinlets": 2, "numoutlets": 1,
            "outlettype": [""], "patching_rect": [320.0, 80.0, 70.0, 22.0], "text": "; dsp start",
        }},
        {"box": {
            "id": "validate-dac-on", "maxclass": "message", "numinlets": 2, "numoutlets": 1,
            "outlettype": [""], "patching_rect": [410.0, 80.0, 30.0, 22.0], "text": "1",
        }},
        {"box": {
            "id": "validate-ezdac", "maxclass": "newobj", "numinlets": 2, "numoutlets": 0,
            "patching_rect": [470.0, 80.0, 48.0, 22.0], "text": "ezdac~",
        }},
        {"box": {
            "id": "validate-noise", "maxclass": "newobj", "numinlets": 0, "numoutlets": 1,
            "outlettype": ["signal"], "patching_rect": [60.0, 160.0, 44.0, 22.0], "text": "noise~",
        }},
        {"box": {
            "id": "validate-noise-gain", "maxclass": "newobj", "numinlets": 2, "numoutlets": 1,
            "outlettype": ["signal"], "patching_rect": [130.0, 160.0, 52.0, 22.0], "text": "*~ 0.08",
        }},
        {"box": {
            "id": "validate-cycle", "maxclass": "newobj", "numinlets": 2, "numoutlets": 1,
            "outlettype": ["signal"], "patching_rect": [60.0, 205.0, 70.0, 22.0], "text": "cycle~ 173",
        }},
        {"box": {
            "id": "validate-cycle-gain", "maxclass": "newobj", "numinlets": 2, "numoutlets": 1,
            "outlettype": ["signal"], "patching_rect": [150.0, 205.0, 52.0, 22.0], "text": "*~ 0.08",
        }},
        {"box": {
            "id": "validate-peak-l", "maxclass": "newobj", "numinlets": 1, "numoutlets": 1,
            "outlettype": ["float"], "patching_rect": [300.0, 290.0, 82.0, 22.0], "text": "peakamp~ 100",
        }},
        {"box": {
            "id": "validate-peak-r", "maxclass": "newobj", "numinlets": 1, "numoutlets": 1,
            "outlettype": ["float"], "patching_rect": [415.0, 290.0, 82.0, 22.0], "text": "peakamp~ 100",
        }},
        {"box": {
            "id": "validate-print-l", "maxclass": "newobj", "numinlets": 1, "numoutlets": 0,
            "patching_rect": [300.0, 330.0, 110.0, 22.0], "text": f"print {name}_L",
        }},
        {"box": {
            "id": "validate-print-r", "maxclass": "newobj", "numinlets": 1, "numoutlets": 0,
            "patching_rect": [415.0, 330.0, 110.0, 22.0], "text": f"print {name}_R",
        }},
        {"box": {
            "id": "validate-js", "maxclass": "newobj", "numinlets": 2, "numoutlets": 0,
            "patching_rect": [550.0, 330.0, 150.0, 22.0], "text": f"js EP_validate.js {name}",
        }},
        {"box": {
            "id": "validate-buffer", "maxclass": "newobj", "numinlets": 1, "numoutlets": 2,
            "outlettype": ["float", "bang"], "patching_rect": [60.0, 400.0, 210.0, 22.0],
            "text": f"buffer~ {name}_render 7000 2",
        }},
        {"box": {
            "id": "validate-record", "maxclass": "newobj", "numinlets": 4, "numoutlets": 1,
            "outlettype": ["signal"], "patching_rect": [300.0, 400.0, 170.0, 22.0],
            "text": f"record~ {name}_render 2",
        }},
        {"box": {
            "id": "validate-record-on", "maxclass": "message", "numinlets": 2, "numoutlets": 1,
            "outlettype": [""], "patching_rect": [500.0, 400.0, 30.0, 22.0], "text": "1",
        }},
        {"box": {
            "id": "validate-write-delay", "maxclass": "newobj", "numinlets": 2, "numoutlets": 1,
            "outlettype": ["bang"], "patching_rect": [60.0, 450.0, 72.0, 22.0], "text": "delay 6500",
        }},
        {"box": {
            "id": "validate-write", "maxclass": "message", "numinlets": 2, "numoutlets": 1,
            "outlettype": [""], "patching_rect": [150.0, 450.0, 700.0, 22.0],
            "text": f"writewave {render_path.as_posix()}",
        }},
        {"box": {
            "id": "validate-quit-delay", "maxclass": "newobj", "numinlets": 2, "numoutlets": 1,
            "outlettype": ["bang"], "patching_rect": [60.0, 500.0, 72.0, 22.0], "text": "delay 7600",
        }},
        {"box": {
            "id": "validate-quit", "maxclass": "message", "numinlets": 2, "numoutlets": 1,
            "outlettype": [""], "patching_rect": [150.0, 500.0, 72.0, 22.0], "text": "; max quit",
        }},
    ]
    p["lines"] += [
        {"patchline": {"source": ["validate-loadbang", 0], "destination": ["validate-defaults", 0]}},
        {"patchline": {"source": ["validate-loadbang", 0], "destination": ["validate-js", 0]}},
        {"patchline": {"source": ["validate-defaults", 0], "destination": [gen_id, 0]}},
        {"patchline": {"source": ["validate-loadbang", 0], "destination": ["validate-driver", 0]}},
        {"patchline": {"source": ["validate-loadbang", 0], "destination": ["validate-start-delay", 0]}},
        {"patchline": {"source": ["validate-start-delay", 0], "destination": ["validate-dsp", 0]}},
        {"patchline": {"source": ["validate-start-delay", 0], "destination": ["validate-dac-on", 0]}},
        {"patchline": {"source": ["validate-dac-on", 0], "destination": ["validate-ezdac", 0]}},
        {"patchline": {"source": ["validate-start-delay", 0], "destination": ["validate-record-on", 0]}},
        {"patchline": {"source": ["validate-record-on", 0], "destination": ["validate-record", 0]}},
        {"patchline": {"source": ["validate-loadbang", 0], "destination": ["validate-write-delay", 0]}},
        {"patchline": {"source": ["validate-write-delay", 0], "destination": ["validate-write", 0]}},
        {"patchline": {"source": ["validate-write", 0], "destination": ["validate-buffer", 0]}},
        {"patchline": {"source": ["validate-loadbang", 0], "destination": ["validate-quit-delay", 0]}},
        {"patchline": {"source": ["validate-quit-delay", 0], "destination": ["validate-quit", 0]}},
        {"patchline": {"source": [gen_id, 0], "destination": ["validate-peak-l", 0]}},
        {"patchline": {"source": [gen_id, 1], "destination": ["validate-peak-r", 0]}},
        {"patchline": {"source": ["validate-peak-l", 0], "destination": ["validate-print-l", 0]}},
        {"patchline": {"source": ["validate-peak-r", 0], "destination": ["validate-print-r", 0]}},
        {"patchline": {"source": ["validate-peak-l", 0], "destination": ["validate-js", 0]}},
        {"patchline": {"source": ["validate-peak-r", 0], "destination": ["validate-js", 1]}},
        {"patchline": {"source": [gen_id, 0], "destination": ["validate-record", 0]}},
        {"patchline": {"source": [gen_id, 1], "destination": ["validate-record", 1]}},
        {"patchline": {"source": [gen_id, 0], "destination": ["validate-ezdac", 0]}},
        {"patchline": {"source": [gen_id, 1], "destination": ["validate-ezdac", 1]}},
    ]
    if inputs == 2:
        p["lines"] += [
            {"patchline": {"source": ["validate-noise", 0], "destination": ["validate-noise-gain", 0]}},
            {"patchline": {"source": ["validate-noise-gain", 0], "destination": [gen_id, 0]}},
            {"patchline": {"source": ["validate-cycle", 0], "destination": ["validate-cycle-gain", 0]}},
            {"patchline": {"source": ["validate-cycle-gain", 0], "destination": [gen_id, 1]}},
        ]
    if outputs > 2:
        p["boxes"].append({"box": {
            "id": "validate-controls-js", "maxclass": "newobj", "numinlets": 5, "numoutlets": 0,
            "patching_rect": [650.0, 560.0, 170.0, 22.0], "text": "js EP_control_validate.js",
        }})
        p["lines"].append({"patchline": {
            "source": ["validate-loadbang", 0], "destination": ["validate-controls-js", 0]
        }})
        for control_index in range(5):
            snapshot_id = f"validate-control-snapshot-{control_index}"
            p["boxes"].append({"box": {
                "id": snapshot_id, "maxclass": "newobj", "numinlets": 2, "numoutlets": 1,
                "outlettype": ["float"],
                "patching_rect": [560.0 + control_index * 58.0, 520.0, 54.0, 22.0],
                "text": "snapshot~ 100",
            }})
            p["lines"] += [
                {"patchline": {"source": [gen_id, control_index + 2], "destination": [snapshot_id, 0]}},
                {"patchline": {"source": [snapshot_id, 0],
                               "destination": ["validate-controls-js", control_index]}},
            ]
    return {"patcher": p}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    validator_defaults = {
        "PALIMPSEST": "capture 1, micro 0.8, cloud 0.7, memory 0.2, fossil 0, density 0.9, reverse 0.3, motion 0.6, feedback 0.2, space 0.8, mix 1, output -10, seed 71",
        "MONTAGE MEMORY": "capture 1, fragment 0.25, history 0.5, repeat 0.5, reverse 0.25, fracture 0.5, rate 1.4, density 1, space 0.7, feedback 0.15, mix 1, output -10, seed 113",
        "SPECTRAL LATTICE": "excite 0.7, lattice 0.6, coupling 0.2, decay 0.65, drift 0.25, anchor 553.71, relation 0.62, brightness 0.6, space 0.8, freeze 0, mix 1, output -12",
        "PARALLAX": "width 0.8, depth 0.6, motion 0.5, rate 0.4, skew 0.4, rotate 0.2, lowwidth 0.3, highwidth 0.9, diffusion 0.7, monocompat 0.5, mix 1, output -10",
        "RESONANT MATTER": "run 1, energy 0.7, density 0.9, material 0.55, decay 0.62, fracture 0.35, rate 2.3, anchor 92.5, relation 0.61, friction 0.4, space 0.8, output -14, seed 173",
    }
    for spec in DEVICE_SPECS:
        document = build_device(spec)
        stem = f"{spec['name'].replace(' ', '_')}_{VERSION}"
        maxpat = OUT / f"{stem}.maxpat"
        amxd = OUT / f"{stem}.amxd"
        maxpat.write_text(json.dumps(document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        write_amxd(amxd, document)
        validator = validator_patcher(
            spec["token"], spec["code"], 1 if spec["type"] == INSTRUMENT else 2, 2,
            validator_defaults[spec["name"]], OUT / f"{stem}_validation.wav")
        (OUT / f"{stem}_validate.maxpat").write_text(
            json.dumps(validator, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        manifest.append({"name": spec["name"], "token": spec["token"], "type": spec["type"], "file": amxd.name})

    conductor = build_conductor()
    conductor_stem = f"FIELD_CONDUCTOR_{VERSION}"
    (OUT / f"{conductor_stem}.maxpat").write_text(
        json.dumps(conductor, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_amxd(OUT / f"{conductor_stem}.amxd", conductor)
    conductor_validator = validator_patcher(
        "conductor", CONDUCTOR_CODE, 2, 7,
        "run 1, hold 0, duration 1, intensity 1, position 0.45, autoposition 0, seed 211",
        OUT / f"{conductor_stem}_validation.wav")
    (OUT / f"{conductor_stem}_validate.maxpat").write_text(
        json.dumps(conductor_validator, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    manifest.append({"name": "FIELD CONDUCTOR", "token": "conductor", "type": AUDIO_EFFECT,
                     "file": f"{conductor_stem}.amxd"})
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    for entry in manifest:
        print(entry["file"])


if __name__ == "__main__":
    main()
