(
// ============================================================
// IRREDUCIBLE v0.2
// psychoacoustic / emergent synthesis organism
// ============================================================

{
    var field;

    var moireGain, shepardGain, beatGain, dopplerGain;
    var globalThin;

    var pulseTrig, pulseEnv, pulsePitchEnv;
    var pulseFreq, lowPulse, pulseDisturb;

    var globalFlurry, flurryDirection;
    var globalShift, shiftDirection;

    var clusterTrig, clusterEnv, clusterCenter;
    var scatterTrig, scatterEnv;

    var sineCenters, sineAmps, sineField;

    var shepard, shepardStereo;

    var beatBase, beatDiff, morph;
    var monoBeat, binaural, beating;

    var c, sourceFreq, x, y;
    var distance, travelTime;
    var source, delayed;
    var dopplerAmp, dopplerPan, doppler;

    var bass;

    var fragileTrig, fragileEnv;
    var fragileBase, fragileGap, fragile;

    var sig;


    // ========================================================
    // GLOBAL ORGANISM STATE
    // ========================================================

    field = LFNoise1.kr(0.025).range(0.72, 1.28);

    moireGain =
        LFNoise2.kr(0.008)
        .range(0.15, 1.0);

    shepardGain =
        LFNoise2.kr(0.006)
        .range(0.0, 0.75);

    beatGain =
        LFNoise2.kr(0.005)
        .range(0.0, 0.7);

    dopplerGain =
        LFNoise2.kr(0.004)
        .range(0.0, 0.65);

    globalThin =
        LFNoise2.kr(0.0025)
        .range(0.08, 1.0)
        .squared;


    // ========================================================
    // LOW-FREQUENCY INTERVENTION
    //
    // Sparse physical pulse.
    // It is not a beat grid.
    // It also destabilises the spectral organism.
    // ========================================================

    pulseTrig = Dust.kr(0.11);

    pulseEnv = Decay2.kr(
        pulseTrig,
        0.001,
        TExpRand.kr(
            0.09,
            0.28,
            pulseTrig
        )
    );

    pulseFreq = TExpRand.kr(
        36,
        62,
        pulseTrig
    );

    pulsePitchEnv = EnvGen.kr(
        Env(
            [1.7, 0.72],
            [0.11],
            [-5]
        ),
        pulseTrig
    );

    lowPulse = SinOsc.ar(
        pulseFreq * pulsePitchEnv,
        0,
        pulseEnv * 0.12
    );

    lowPulse =
        lowPulse
        + (lowPulse.tanh * 0.25);

    lowPulse = [
        lowPulse,
        DelayC.ar(
            lowPulse,
            0.015,
            0.004
        )
    ];

    pulseDisturb =
        pulseEnv
        * LFNoise1.kr(0.8)
        .range(-90, 90);


    // ========================================================
    // PROPAGATING FLURRIES
    // ========================================================

    globalFlurry = Dust.kr(0.10);

    flurryDirection = TIRand.kr(
        0,
        1,
        globalFlurry
    );


    // ========================================================
    // PROPAGATING FREQUENCY RELOCATION
    // ========================================================

    globalShift = Dust.kr(0.035);

    shiftDirection = TIRand.kr(
        0,
        1,
        globalShift
    );


    // ========================================================
    // ATTRACT / COLLAPSE
    // ========================================================

    clusterTrig = Dust.kr(0.045);

    clusterEnv = Decay2.kr(
        clusterTrig,
        0.15,
        TExpRand.kr(
            2.0,
            9.0,
            clusterTrig
        )
    );

    clusterCenter = TExpRand.kr(
        120,
        1800,
        clusterTrig
    );


    // ========================================================
    // SCATTER
    // ========================================================

    scatterTrig = Dust.kr(0.022);

    scatterEnv = Decay2.kr(
        scatterTrig,
        0.005,
        TExpRand.kr(
            0.2,
            2.5,
            scatterTrig
        )
    );


    // ========================================================
    // MUTATING SINE BANK
    //
    // Six regions:
    // breathe
    // flare
    // relocate
    // converge
    // scatter
    // propagate disturbances
    // ========================================================

    sineCenters = [
        145,
        195,
        273,
        360,
        505,
        715
    ];

    sineAmps = [
        0.007,
        0.0065,
        0.006,
        0.005,
        0.004,
        0.003
    ];


    sineField = Mix.fill(6, { |i|

        var base;

        var rateTrig;
        var rateRaw;
        var rate;

        var localFlurry;
        var cascadeStep;
        var cascadeTrig;

        var flare;
        var flareStrength;

        var depth;
        var motion;

        var shiftTrig;
        var ratioRaw;
        var ratio;
        var ratioSmooth;

        var shiftStep;
        var cascadeShiftTrig;
        var cascadeShiftEnv;
        var cascadeShiftAmount;

        var attraction;
        var scattering;

        var leftFreq;
        var rightFreq;


        // ----------------------------------------------------
        // BASE REGION
        // ----------------------------------------------------

        base = sineCenters[i];


        // ----------------------------------------------------
        // PROBABILISTIC BREATH RATE
        //
        // Slow states dominate.
        // Fast states become increasingly improbable.
        // ----------------------------------------------------

        rateTrig = Dust.kr(
            0.035 + (i * 0.004)
        );

        rateRaw = Demand.kr(
            rateTrig,
            0,
            Dwrand(
                [
                    0.008,
                    0.012,
                    0.018,
                    0.026,
                    0.040,
                    0.065,
                    0.10,
                    0.16,
                    0.25,
                    0.40
                ],
                [
                    14,
                    14,
                    12,
                    10,
                    8,
                    6,
                    4,
                    2.5,
                    1.2,
                    0.4
                ],
                inf
            )
        );

        rate = Select.kr(
            rateRaw <= 0,
            [
                rateRaw,
                0.015 + (i * 0.003)
            ]
        );


        // ----------------------------------------------------
        // LOCAL FLURRIES
        // ----------------------------------------------------

        localFlurry = Dust.kr(
            0.045 + (i * 0.008)
        );


        // ----------------------------------------------------
        // FLURRY CASCADE
        //
        // A disturbance can move
        // low -> high or high -> low.
        // ----------------------------------------------------

        cascadeStep = Select.kr(
            flurryDirection,
            [
                i,
                5 - i
            ]
        );

        cascadeTrig = DelayN.kr(
            globalFlurry,
            1.2,
            cascadeStep * 0.12
        );

        flare = Decay2.kr(
            localFlurry + cascadeTrig,
            0.008,
            TExpRand.kr(
                0.18,
                1.7,
                localFlurry + cascadeTrig
            )
        );

        flareStrength =
            1
            + (
                flare
                * TExpRand.kr(
                    2.5,
                    14,
                    localFlurry + cascadeTrig
                )
            );


        // ----------------------------------------------------
        // MOTION DEPTH
        // ----------------------------------------------------

        depth = 12 + (i * 19);


        // ----------------------------------------------------
        // MOTION GEOMETRY
        //
        // Different voices use different trajectories.
        // ----------------------------------------------------

        motion = Select.kr(
            i % 4,
            [

                SinOsc.kr(
                    rate * flareStrength,
                    i * 0.71
                ).range(
                    depth.neg,
                    depth
                ),

                LFTri.kr(
                    rate * flareStrength,
                    i / 6
                ).range(
                    (depth * 1.25).neg,
                    depth * 1.25
                ),

                LFSaw.kr(
                    rate * flareStrength,
                    i / 6
                ).range(
                    (depth * 1.5).neg,
                    depth
                ),

                LFNoise1.kr(
                    rate
                    * flareStrength
                    * 3
                ).range(
                    depth.neg,
                    depth
                )
            ]
        );


        // ----------------------------------------------------
        // PERSISTENT FREQUENCY RELOCATION
        //
        // Small shifts common.
        // Large register changes rare.
        // ----------------------------------------------------

        shiftTrig = Dust.kr(
            0.020 + (i * 0.003)
        );

        ratioRaw = Demand.kr(
            shiftTrig,
            0,
            Dwrand(
                [
                    1.00,

                    0.97,
                    1.03,

                    0.93,
                    1.07,

                    0.86,
                    1.16,

                    0.75,
                    1.33,

                    0.67,
                    1.50
                ],
                [
                    18,

                    12,
                    12,

                    8,
                    8,

                    4,
                    4,

                    2,
                    2,

                    0.6,
                    0.6
                ],
                inf
            )
        );

        ratio = Select.kr(
            ratioRaw <= 0,
            [
                ratioRaw,
                1
            ]
        );

        ratioSmooth = VarLag.kr(
            ratio,
            TExpRand.kr(
                0.025,
                2.8,
                shiftTrig
            )
        );


        // ----------------------------------------------------
        // PROPAGATING FREQUENCY SHIFT
        // ----------------------------------------------------

        shiftStep = Select.kr(
            shiftDirection,
            [
                i,
                5 - i
            ]
        );

        cascadeShiftTrig = DelayN.kr(
            globalShift,
            1.5,
            shiftStep * 0.17
        );

        cascadeShiftEnv = Decay2.kr(
            cascadeShiftTrig,
            0.01,
            TExpRand.kr(
                0.3,
                2.4,
                cascadeShiftTrig
            )
        );

        cascadeShiftAmount =
            cascadeShiftEnv
            * TChoose.kr(
                cascadeShiftTrig,
                [
                    -120,
                    -75,
                    -45,
                    35,
                    60,
                    95,
                    150
                ]
            );


        // ----------------------------------------------------
        // ATTRACTION
        //
        // Voices temporarily converge toward
        // one spectral centre.
        // ----------------------------------------------------

        attraction =
            (clusterCenter - base)
            * clusterEnv
            * (0.55 + (i * 0.065));


        // ----------------------------------------------------
        // SCATTERING
        //
        // Sudden divergence after / during convergence.
        // ----------------------------------------------------

        scattering =
            scatterEnv
            * TChoose.kr(
                scatterTrig,
                [
                    -700,
                    -450,
                    -280,
                    -160,
                    140,
                    230,
                    390,
                    620
                ]
            )
            * (0.55 + (i * 0.12));


        // ----------------------------------------------------
        // FINAL FREQUENCY TRAJECTORIES
        // ----------------------------------------------------

        leftFreq =
            (base * ratioSmooth)
            + motion
            + cascadeShiftAmount
            + attraction
            + scattering
            + pulseDisturb;

        rightFreq =
            (base * ratioSmooth)
            - (
                motion
                * (0.78 + (i * 0.035))
            )
            + (
                attraction
                * (0.82 - (i * 0.025))
            )
            - (scattering * 0.91)
            - (cascadeShiftAmount * 0.86)
            - pulseDisturb;


        [
            SinOsc.ar(
                leftFreq.clip(25, 12000),
                0,
                sineAmps[i]
            ),

            SinOsc.ar(
                rightFreq.clip(25, 12000),
                0,
                sineAmps[i]
            )
        ]
    });


    // ========================================================
    // UNSTABLE SHEPARD / RISSET FIELD
    // ========================================================

    shepard = Mix.fill(7, { |i|

        var ratio;
        var drift;
        var phase;
        var freq;
        var amp;

        ratio = 2.pow(i - 3);

        drift = LFNoise1.kr(
            0.06 + (i * 0.009)
        ).range(
            0.86,
            1.14
        );

        phase = LFSaw.kr(
            0.017 * drift * field,
            i / 7
        ).range(
            0,
            1
        );

        freq =
            75
            * ratio
            * 2.pow(phase);

        amp =
            sin(pi * phase)
            .squared
            * 0.0035;

        SinOsc.ar(
            freq,
            0,
            amp
        )
    });

    shepardStereo = [
        shepard,

        DelayC.ar(
            shepard,
            0.03,
            LFNoise1.kr(0.15)
            .range(
                0.002,
                0.012
            )
        )
    ];


    // ========================================================
    // ACOUSTIC <-> BINAURAL BEATING
    // ========================================================

    beatBase =
        165
        * field;

    beatDiff =
        LFNoise1.kr(0.045)
        .range(
            2.0,
            7.0
        );

    morph =
        LFNoise2.kr(0.01)
        .range(
            0,
            1
        );

    monoBeat = [

        SinOsc.ar(
            beatBase,
            0,
            0.008
        )
        +
        SinOsc.ar(
            beatBase + beatDiff,
            0,
            0.008
        ),

        SinOsc.ar(
            beatBase,
            0,
            0.008
        )
        +
        SinOsc.ar(
            beatBase + beatDiff,
            0,
            0.008
        )
    ];

    binaural = [

        SinOsc.ar(
            beatBase,
            0,
            0.012
        ),

        SinOsc.ar(
            beatBase + beatDiff,
            0,
            0.012
        )
    ];

    beating = XFade2.ar(
        monoBeat,
        binaural,
        morph.linlin(
            0,
            1,
            -1,
            1
        )
    );


    // ========================================================
    // VARIABLE-PROPAGATION-DELAY DOPPLER
    //
    // Oscillator pitch stays constant.
    // Apparent pitch movement emerges from
    // changing propagation delay.
    // ========================================================

    c = 343;

    sourceFreq =
        320
        * field;

    x = SinOsc.kr(
        0.045 * field
    ).range(
        -16,
        16
    );

    y = LFNoise1.kr(0.02)
        .range(
            1.0,
            4.5
        );

    distance =
        (
            x.squared
            + y.squared
        ).sqrt;

    travelTime =
        distance / c;

    source = SinOsc.ar(
        sourceFreq,
        0,
        0.018
    );

    delayed = DelayC.ar(
        source,
        0.14,
        travelTime
    );

    dopplerAmp =
        (
            1
            /
            (
                1
                + (distance * 0.22)
            )
        ).clip(
            0.06,
            0.55
        );

    dopplerPan =
        (x / 16)
        .clip(
            -1,
            1
        );

    doppler = Pan2.ar(
        delayed * dopplerAmp,
        dopplerPan
    );


    // ========================================================
    // LOW BASS BODY
    //
    // Second voice remains approximately
    // a fifth below the first region.
    // ========================================================

    bass = [

        SinOsc.ar(
            LFNoise1.kr(0.03)
            .range(
                42,
                58
            ),
            0,
            0.035
        ),

        SinOsc.ar(
            LFNoise1.kr(0.027)
            .range(
                28.0,
                38.7
            ),
            0,
            0.035
        )
    ];

    bass =
        bass
        * LFNoise2.kr(0.004)
        .range(
            0.25,
            0.9
        );


    // ========================================================
    // FRAGILE HIGH-FREQUENCY ZONE
    //
    // Keep monitoring level conservative.
    // ========================================================

    fragileTrig = Dust.kr(0.028);

    fragileEnv = Decay2.kr(
        fragileTrig,
        0.8,
        TExpRand.kr(
            4.0,
            14.0,
            fragileTrig
        )
    );

    fragileBase = TExpRand.kr(
        2600,
        7200,
        fragileTrig
    );

    fragileGap = TExpRand.kr(
        3.0,
        28.0,
        fragileTrig
    );

    fragile = [

        SinOsc.ar(
            fragileBase,
            0,
            0.0035
        )
        +
        SinOsc.ar(
            fragileBase
            + fragileGap,
            0,
            0.0035
        ),

        SinOsc.ar(
            fragileBase * 1.003,
            0,
            0.0035
        )
        +
        SinOsc.ar(
            (fragileBase * 1.003)
            + (fragileGap * 0.87),
            0,
            0.0035
        )
    ];

    // Low pulse temporarily damages the fragile field

    fragile =
        fragile
        * fragileEnv
        * (
            1
            - (pulseEnv * 0.85)
        );


    // ========================================================
    // FINAL RECOMBINATION
    // ========================================================

    sig =
        (sineField * moireGain)
        + (shepardStereo * shepardGain)
        + (beating * beatGain)
        + (doppler * dopplerGain)
        + bass
        + lowPulse
        + fragile;


    // Whole organism occasionally approaches collapse

    sig =
        sig
        * globalThin;


    // Conservative protection

    Limiter.ar(
        sig,
        0.7
    )

}.play;
)