/* Atlas of Ages — world content: eras, maps, NPCs, quests, trials, codex.
   Maps are string grids. Legend:
   . , ground | ~ water | T tree | R rock | H house | N tent | W well |
   A altar | F fire | B boat | P pyramid | o portal pad | * flowers (walk) */
window.ATLAS = {
  tile: 24,
  eras: [
    {
      id: 'eden', name: 'The Garden', sub: 'In the beginning', sky: [10, 30, 34],
      ground: ['#2d6a4f', '#2b6248'], water: '#40916c', accent: '#f4a259',
      map: [
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'T......,,......TTTT......,,......TTTT..T',
        'T..*....,,....TTTTTT......,,.....*.....T',
        'T......,,......TTTTTT.....,,.....**....T',
        'T..H...,,.......TTTT......,,...........T',
        'T......,,.................,,.....TTTT..T',
        'T......,,..**.............TT.....TTTT..T',
        'T......,,...........A......TT......TT..T',
        'T...,,,~~~~,,.....................TT..T',
        'T...,,,~~~~,,....**........R......TT..T',
        'T...,,,~~~~,,......................T..T',
        'T...,,,~~~~,,..TTTT..........**.......T',
        'T...,,,~~~~,,..TTTT....W.............oT',
        'T...,,,~~~~,,..TTTT..................TT',
        'T...,,,~~~~,,......,,....TTTT........TT',
        'T...,,,~~~~,,......,,....TTTT....*...TT',
        'T...,,,~~~~,,......,,............**..TT',
        'T...,,,~~~~,,......,,....R...........TT',
        'T......,,......**..,,................TT',
        'T..*...,,..........,,.....TTTT.......TT',
        'T......,,..........,,.....TTTT...*...TT',
        'T......,,..........,,.....TTTT.......TT',
        'T..R...,,..........,,.................TT',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
      ],
      playerStart: { x: 5, y: 20 },
      foes: [{ x: 30, y: 6 }, { x: 10, y: 18 }],
      npcs: [
        { id: 'keeper', x: 4, y: 6, name: 'The Keeper', emoji: '🧙', color: '#e9c46a',
          lines: ['Welcome, traveler of ages! I keep this Garden.', 'Will you help me? The first fruits are ripe — gather 3 and bring them back.'],
          quest: 'fruit' },
        { id: 'lion', x: 28, y: 10, name: 'Lion', emoji: '🦁', color: '#e76f51', animal: true,
          lines: ['Roar! (That means hello. Probably.)'], questStep: 'animals' },
        { id: 'dove', x: 12, y: 16, name: 'Dove', emoji: '🕊️', color: '#edf2f4', animal: true,
          lines: ['Coo... peace to you, traveler.'], questStep: 'animals' },
        { id: 'lamb', x: 30, y: 20, name: 'Lamb', emoji: '🐑', color: '#fefae0', animal: true,
          lines: ['Baa! The grass here is wonderful.'], questStep: 'animals' }
      ],
      relics: [
        { id: 'fig', x: 6, y: 2, name: 'Fig', emoji: '🍈', questId: 'fruit' },
        { id: 'grape', x: 24, y: 5, name: 'Grapes', emoji: '🍇', questId: 'fruit' },
        { id: 'apple', x: 33, y: 15, name: 'Apple', emoji: '🍎', questId: 'fruit' },
        { id: 'apple2', x: 24, y: 11, name: 'Apple', emoji: '🍎', questId: 'fruit' },
        { id: 'scroll-eden', x: 19, y: 7, name: 'Scroll of Beginnings', emoji: '📜',
          codex: { title: 'The Garden', text: 'Genesis 1–2: God plants a garden in Eden. Four rivers water it. Adam is placed there "to work it and keep it" — the first job in history was gardening!' } }
      ],
      quests: [
        { id: 'fruit', name: '🍈 First Fruits', giver: 'keeper',
          briefing: 'Gather 3 fruits and bring them to the Keeper.',
          steps: [{ text: 'Gather fruits', need: 3 }, { text: 'Return to the Keeper', talk: 'keeper' }],
          reward: { light: 10, codex: { title: 'Firstfruits', text: 'Israel later offered the first sheaf of harvest to God (Leviticus 23). Giving God the first — not the leftovers — is one of the oldest acts of worship.' } } },
        { id: 'animals', name: '🦁 Name the Animals', giver: 'keeper',
          briefing: 'Greet the Lion, the Dove and the Lamb.',
          steps: [{ text: 'Greet the Lion', talk: 'lion' }, { text: 'Greet the Dove', talk: 'dove' }, { text: 'Greet the Lamb', talk: 'lamb' }, { text: 'Tell the Keeper', talk: 'keeper' }],
          reward: { light: 10, codex: { title: 'Adam Names the Animals', text: 'Genesis 2:19 — God brings every animal to Adam "to see what he would call them." Naming is the first science: observing creation closely.' } } }
      ],
      trial: {
        title: '⏳ Order the Days of Creation',
        events: ['Light separates day and night', 'Dry land and seas appear', 'Sun, moon and stars are set', 'Humans are formed'],
        note: 'The portal to Egypt sleeps until the ages stand in order.'
      },
      next: 'egypt',
      thread: 'Every story needs a beginning. This one starts in a garden — and every garden since has pointed back to it.',
      intro: {
        date: 'Before time was measured',
        facts: [
          'God plants a garden "in the east, in Eden" — the Hebrew word Eden means delight.',
          'Four rivers water it. Two are still on the map: the Tigris and the Euphrates.',
          'Adam is put there "to work it and keep it" — the first job in history was gardening.'
        ],
        verse: 'Genesis 2:15 — "The LORD God took the man and put him in the Garden of Eden to work it and keep it."'
      }
    },
    {
      id: 'egypt', name: 'Egypt & Exodus', sub: 'Let my people go', sky: [46, 32, 12],
      ground: ['#c2a05e', '#b8955a'], water: '#2a9d8f', accent: '#e76f51',
      map: [
        'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP',
        'P....................................P',
        'P..N..........,,,,..........N.......o.P',
        'P..N..........,,,,..........N........PP',
        'P.............FFFF...................P',
        'P.....R..............................P',
        'P....................................P',
        'P~~~~~~~~............................P',
        'P~~~~~~~~............................P',
        'P~~~~~~~~~~~~........................P',
        'P....~~~~~~~~~~~~~~..........H.......P',
        'P.........~~~~~~~~~~~~~~.............P',
        'P.............~~~~~~~~~~~~~~~~.......P',
        'P..N.................~~~~~~~~~~......P',
        'P..N......W.................~~~~~....P',
        'P.............................~~~~...P',
        'P.....R..............................P',
        'P..............N..........R..........P',
        'P..............N.....................P',
        'P......**............................P',
        'P....................................P',
        'P....H...........................R...P',
        'P....................................P',
        'PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP'
      ],
      playerStart: { x: 5, y: 20 },
      foes: [{ x: 30, y: 19 }, { x: 12, y: 6 }],
      npcs: [
        { id: 'miriam', x: 10, y: 13, name: 'Miriam', emoji: '👩', color: '#f4a259',
          lines: ['The foreman demands bricks but gives no straw! Gather 4 straw bundles for our people.', 'Hurry — and keep away from the taskmaster’s fire.'],
          quest: 'straw' },
        { id: 'foreman', x: 20, y: 4, name: 'Foreman', emoji: '👷', color: '#9c6644',
          lines: ['More bricks! Pharaoh’s quota never sleeps.', 'You carry straw? The people will sing of you.'] },
        { id: 'elder', x: 33, y: 11, name: 'Elder', emoji: '🧓', color: '#e9c46a',
          lines: ['Child, do you know the song of the sea? Bring me 3 river reeds and I will teach you.'],
          quest: 'song' }
      ],
      relics: [
        { id: 'straw1', x: 6, y: 19, name: 'Straw', emoji: '🌾', questId: 'straw' },
        { id: 'straw2', x: 17, y: 21, name: 'Straw', emoji: '🌾', questId: 'straw' },
        { id: 'straw3', x: 28, y: 6, name: 'Straw', emoji: '🌾', questId: 'straw' },
        { id: 'straw4', x: 36, y: 18, name: 'Straw', emoji: '🌾', questId: 'straw' },
        { id: 'straw5', x: 24, y: 16, name: 'Straw', emoji: '🌾', questId: 'straw' },
        { id: 'reed1', x: 2, y: 10, name: 'Reed', emoji: '🎋', questId: 'song' },
        { id: 'reed2', x: 9, y: 11, name: 'Reed', emoji: '🎋', questId: 'song' },
        { id: 'reed3', x: 12, y: 12, name: 'Reed', emoji: '🎋', questId: 'song' },
        { id: 'scroll-ex', x: 33, y: 20, name: 'Scroll of the Sea', emoji: '📜',
          codex: { title: 'The Red Sea', text: 'Exodus 14: the sea parts, Israel walks through on dry ground. The Song of Moses (Exodus 15) is one of the oldest poems in the Bible.' } }
      ],
      quests: [
        { id: 'straw', name: '🌾 Bricks Without Straw', giver: 'miriam',
          briefing: 'Gather 4 straw bundles, then return to Miriam.',
          steps: [{ text: 'Gather straw', need: 4 }, { text: 'Return to Miriam', talk: 'miriam' }],
          reward: { light: 12, codex: { title: 'Bricks Without Straw', text: 'Exodus 5: Pharaoh removes the straw but keeps the quota. Mudbrick with straw is real Egyptian technology — archaeologists still find straw in 3,000-year-old bricks.' } } },
        { id: 'song', name: '🎶 Song of the Sea', giver: 'elder',
          briefing: 'Bring 3 river reeds to the Elder.',
          steps: [{ text: 'Gather reeds', need: 3 }, { text: 'Return to the Elder', talk: 'elder' }],
          reward: { light: 12, codex: { title: 'Miriam’s Tambourine', text: 'Exodus 15:20 — Miriam leads the women with tambourines and dancing. Music was Israel’s first history book: they sang what God had done so they would never forget.' } } }
      ],
      trial: {
        title: '⏳ Order the Exodus',
        events: ['Baby Moses in the basket', 'The burning bush', 'The ten plagues', 'Crossing the Red Sea'],
        note: 'The portal to Galilee sleeps until the ages stand in order.'
      },
      next: 'galilee',
      thread: 'The seed promised in Eden became a family, then a nation — now enslaved. But God heard their groaning.',
      intro: {
        date: 'c. 1446 BC',
        facts: [
          'Israel lived in Egypt 430 years — long enough to grow from 70 people into a nation of perhaps two million.',
          'Mudbricks with straw are real Egyptian technology; archaeologists still find straw in 3,000-year-old bricks.',
          'The Red Sea crossing is remembered every year at Passover — the meal Jesus himself ate.'
        ],
        verse: 'Exodus 3:7 — "I have surely seen the affliction of my people... and I have come down to deliver them."'
      }
    },
    {
      id: 'galilee', name: 'Galilee', sub: 'Follow me', sky: [8, 22, 44],
      ground: ['#606c38', '#57652f'], water: '#277da1', accent: '#f9c74f',
      map: [
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'T....................................T',
        'T..H......**..........H...........B..T',
        'T..H..................H..............T',
        'T....................................T',
        'T......R.............................T',
        'T....................................T',
        'T~~~~~~~~............................T',
        'T~~~~~~~~~~..........................T',
        'T~~~~~~~~~~~~......**................T',
        'T.~~~~~~~~~~~~~~.........H...........T',
        'T..~~~~~~~~~~~~~~~~......H...........T',
        'T...~~~~~~~~~~~~~~~~~................T',
        'T....~~~~~~~~~~~~~~~~~~~......B......T',
        'T.....~~~~~~~~~~~~~~~~~~~~~~........T',
        'T.......~~~~~~~~~~~~~~~~~~~~~~..R...T',
        'T.........~~~~~~~~~~~~~~~~~~~~......T',
        'T...........~~~~~~..................T',
        'T....................................T',
        'T......H.........................W..T',
        'T......H......................**...oT',
        'T...................................T',
        'T..*............................*...T',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
      ],
      playerStart: { x: 5, y: 18 },
      foes: [{ x: 28, y: 6 }, { x: 15, y: 21 }],
      npcs: [
        { id: 'peter', x: 32, y: 13, name: 'Peter', emoji: '🎣', color: '#90be6d',
          lines: ['Our nets are torn and the catch was nothing! Bring me 3 mended nets.', 'The Teacher says we will fish for people. I don’t understand — but I believe.'],
          quest: 'nets' },
        { id: 'teacher', x: 10, y: 19, name: 'The Teacher', emoji: '✨', color: '#f9c74f',
          lines: ['Blessed are the curious, for they shall discover.', 'A crowd gathers and they are hungry. Bring 5 baskets — loaves and fishes — and watch.'],
          quest: 'loaves' },
        { id: 'child', x: 11, y: 3, name: 'Child', emoji: '🧒', color: '#f8961e',
          lines: ['Have you seen my boat? It is the little blue one by the lake!'] }
      ],
      relics: [
        { id: 'net1', x: 20, y: 9, name: 'Net', emoji: '🥅', questId: 'nets' },
        { id: 'net2', x: 8, y: 16, name: 'Net', emoji: '🥅', questId: 'nets' },
        { id: 'net3', x: 26, y: 17, name: 'Net', emoji: '🥅', questId: 'nets' },
        { id: 'net4', x: 15, y: 5, name: 'Net', emoji: '🥅', questId: 'nets' },
        { id: 'loaf1', x: 6, y: 20, name: 'Loaf', emoji: '🍞', questId: 'loaves' },
        { id: 'loaf2', x: 30, y: 18, name: 'Loaf', emoji: '🍞', questId: 'loaves' },
        { id: 'fish1', x: 30, y: 14, name: 'Fish', emoji: '🐟', questId: 'loaves' },
        { id: 'fish2', x: 12, y: 8, name: 'Fish', emoji: '🐟', questId: 'loaves' },
        { id: 'fish3', x: 34, y: 6, name: 'Fish', emoji: '🐟', questId: 'loaves' },
        { id: 'scroll-gal', x: 34, y: 20, name: 'Scroll of the Lake', emoji: '📜',
          codex: { title: 'Sea of Galilee', text: 'A real lake 13 miles long, 700 feet below sea level. Sudden storms funnel through the hills — which is why the disciples feared the waves, and why walking on them stunned them.' } }
      ],
      quests: [
        { id: 'nets', name: '🥅 Mended Nets', giver: 'peter',
          briefing: 'Gather 3 nets and bring them to Peter.',
          steps: [{ text: 'Gather nets', need: 3 }, { text: 'Return to Peter', talk: 'peter' }],
          reward: { light: 14, codex: { title: 'Fishers of Men', text: 'Luke 5: after a night with nothing, Peter’s nets break with fish. Jesus says, "From now on you will catch people." Peter leaves everything — the biggest catch becomes the catcher.' } } },
        { id: 'loaves', name: '🍞 Loaves & Fishes', giver: 'teacher',
          briefing: 'Gather 5 baskets of food for the crowd.',
          steps: [{ text: 'Gather food', need: 5 }, { text: 'Return to the Teacher', talk: 'teacher' }],
          reward: { light: 14, codex: { title: 'Five Thousand Fed', text: 'John 6: five loaves and two fish feed 5,000 — with twelve baskets left over. It echoes the manna in the wilderness: God provides, with abundance left to share.' } } }
      ],
      trial: {
        title: '⏳ Order the Gospel',
        events: ['Born in Bethlehem', 'Baptized in the Jordan', 'Calms the storm', 'Rises on the third day'],
        note: 'The way west sleeps until the ages stand in order.'
      },
      next: 'wilderness',
      thread: 'Empires rose and fell; prophets whispered of a Servant who would come. Now, on this lake, He walks.',
      intro: {
        date: 'c. AD 27–30',
        facts: [
          'The Sea of Galilee is a real lake, 13 miles long and 700 feet below sea level — sudden hill-funneled storms terrified even professional fishermen.',
          'Galilee sat on trade crossroads; its towns heard a dozen languages — perfect ground for news that would travel.',
          'Synagogues, fishing boats, tax collectors: ordinary life into which the extraordinary walked.'
        ],
        verse: 'Mark 1:17 — "Follow me, and I will make you fishers of men."'
      }
    },
    {
      id: 'wilderness', name: 'The Wilderness', sub: 'Bread from heaven', sky: [40, 30, 16],
      ground: ['#a68a56', '#99804f'], water: '#2a9d8f', accent: '#e9c46a',
      map: [
        'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
        'R......................................R',
        'R....N..................R..............R',
        'R..........F.................R.........R',
        'R......***......................R......R',
        'R...............................R......R',
        'R............W.............R...........R',
        'R.....R......***................R......R',
        'R......................................R',
        'R.....................N........R.......R',
        'R........F...................R.........R',
        'R................***............R......R',
        'R..........................R....***...R',
        'R......R.....................R.........R',
        'R......................................R',
        'R...................R..........R.......R',
        'R.........***..................R.......R',
        'R............................R...R....R',
        'R............W...............R.........R',
        'R......................................R',
        'R.......................R........o.....R',
        'R......................................R',
        'R..........R..............R..........R.R',
        'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR'
      ],
      playerStart: { x: 5, y: 21 },
      foes: [{ x: 30, y: 8 }, { x: 8, y: 16 }],
      npcs: [
        { id: 'guide', x: 10, y: 5, name: 'The Guide', emoji: '🧔', color: '#b08968',
          lines: ['Forty years, traveler. Forty years of sand and promise.', 'Each dawn brings manna — gather 4 portions for the camp, and I will tell you of the rock that gave water.'],
          quest: 'manna' },
        { id: 'caleb', x: 20, y: 9, name: 'Caleb', emoji: '🗡️', color: '#7f5539',
          lines: ['The murmurs take shape in the dark, friend. Shadows with teeth.', 'Drive back 2 shadows and the camp will sleep soundly. Use E to strike when they close in!'],
          quest: 'murmurs' },
        { id: 'cook', x: 14, y: 18, name: 'Cook', emoji: '👩‍🍳', color: '#e9c46a',
          lines: ['Manna again! Grind it, bake it — it tastes like honey wafers.', 'They say the rock followed them. Drink deep, traveler.'] }
      ],
      relics: [
        { id: 'manna1', x: 7, y: 4, name: 'Manna', emoji: '🥖', questId: 'manna' },
        { id: 'manna2', x: 12, y: 7, name: 'Manna', emoji: '🥖', questId: 'manna' },
        { id: 'manna3', x: 20, y: 11, name: 'Manna', emoji: '🥖', questId: 'manna' },
        { id: 'manna4', x: 30, y: 16, name: 'Manna', emoji: '🥖', questId: 'manna' },
        { id: 'manna5', x: 10, y: 19, name: 'Manna', emoji: '🥖', questId: 'manna' },
        { id: 'water1', x: 22, y: 3, name: 'Water', emoji: '💧', questId: 'water' },
        { id: 'water2', x: 26, y: 3, name: 'Water', emoji: '💧', questId: 'water' },
        { id: 'water3', x: 23, y: 5, name: 'Water', emoji: '💧', questId: 'water' },
        { id: 'scroll-man', x: 33, y: 12, name: 'Scroll of Manna', emoji: '📜',
          codex: { title: 'Manna', text: 'Exodus 16: thin flakes like frost, tasting of honey wafers. One omer per person — no storing (except before the Sabbath). God teaches daily dependence.' } }
      ],
      quests: [
        { id: 'manna', name: '🥖 Morning Manna', giver: 'guide',
          briefing: 'Gather 4 portions of manna, then return to the Guide.',
          steps: [{ text: 'Gather manna', need: 4 }, { text: 'Return to the Guide', talk: 'guide' }],
          reward: { light: 12, codex: { title: 'Water from the Rock', text: 'Exodus 17: Moses strikes the rock at Massah and Meribah ("testing" and "quarreling") — and water pours out. Centuries later Paul writes "the Rock was Christ" (1 Corinthians 10:4).' } } },
        { id: 'water', name: '💧 Strike the Rock', giver: 'guide',
          briefing: 'Draw 3 waters and bring them to the Guide.',
          steps: [{ text: 'Draw water', need: 3 }, { text: 'Return to the Guide', talk: 'guide' }],
          reward: { light: 12, codex: { title: 'Forty Years', text: 'Numbers 14: a journey of weeks becomes forty years. An entire generation learns — the hard way — that complaining is not a strategy. Only Caleb and Joshua enter in.' } } },
        { id: 'murmurs', name: '🗡️ Against the Murmurs', giver: 'caleb',
          briefing: 'Drive back 2 shadows. Strike with E when they close in.',
          steps: [{ text: 'Defeat shadows', slay: 2 }],
          reward: { light: 14, codex: { title: 'Caleb’s Different Spirit', text: 'Numbers 14:24 — Caleb "has a different spirit and has followed me fully." Courage, in the Bible, is rarely the absence of giants. It is trust in the middle of them.' } } }
      ],
      trial: {
        title: '⏳ Order the Wilderness',
        events: ['Manna every morning', 'Water from the rock', 'The ten words from Sinai', 'Forty years of wandering'],
        note: 'The road to Babylon sleeps until the ages stand in order.'
      },
      next: 'exile',
      thread: 'Out of Egypt — but Egypt not yet out of them. A generation will learn daily bread in the sand.',
      intro: {
        date: 'c. 1446–1406 BC',
        facts: [
          'Manna fell six mornings a week for forty years — thin flakes "like frost," tasting of honey wafers.',
          'At Sinai the Ten Words are spoken amid thunder; a traveling tent — the tabernacle — becomes God’s address.',
          'A journey of weeks becomes forty years: complaining, it turns out, is not a strategy.'
        ],
        verse: 'Deuteronomy 8:3 — "Man does not live by bread alone, but by every word that comes from the mouth of the LORD."'
      }
    },
    {
      id: 'exile', name: 'Exile in Babylon', sub: 'By the rivers', sky: [24, 14, 44],
      ground: ['#8a6f4d', '#7d6547'], water: '#3a86ff', accent: '#ffd166',
      map: [
        '########################################',
        '#......................................#',
        '#.....H.............H.............o....#',
        '#........R...................R.........#',
        '#................***.............R.....#',
        '#......................................#',
        '#......W......................H........#',
        '#.............F...........F............#',
        '#....R..........................R......#',
        '#......................................#',
        '#..................N..........N........#',
        '#.........***.................R........#',
        '#..........................H..........#',
        '#.......R...................R..........#',
        '#......................................#',
        '#...............~~~............~~~.....#',
        '#..............~~~~............~~~~...#',
        '#...............~~~............~~~.....#',
        '#......................................#',
        '#....................R........R........#',
        '#........H...................H.........#',
        '#......................................#',
        '#............R.............R..........R#',
        '########################################'
      ],
      playerStart: { x: 5, y: 21 },
      foes: [{ x: 20, y: 8 }, { x: 30, y: 21 }],
      npcs: [
        { id: 'daniel', x: 10, y: 5, name: 'Daniel', emoji: '🤲', color: '#4cc9f0',
          lines: ['Three times a day I open my window toward Jerusalem — even here.', 'The lamps of the faithful burn low. Bring 3 oil lamps and I will show you how to pray in exile.'],
          quest: 'lamps' },
        { id: 'scribe', x: 30, y: 13, name: 'Scribe', emoji: '✍️', color: '#e9c46a',
          lines: ['Jeremiah’s letter must reach every family: build houses, plant gardens, seek the city’s welfare.', 'Carry 3 sealed letters for me — the exiles must hear hope.'],
          quest: 'letters' },
        { id: 'weaver', x: 20, y: 20, name: 'Weaver', emoji: '🧵', color: '#b08968',
          lines: ['By the rivers of Babylon we hung our harps — but I kept one string.', 'Sing quietly, traveler. Even here, songs grow.'] }
      ],
      relics: [
        { id: 'lamp1', x: 16, y: 4, name: 'Oil lamp', emoji: '🏮', questId: 'lamps' },
        { id: 'lamp2', x: 10, y: 11, name: 'Oil lamp', emoji: '🏮', questId: 'lamps' },
        { id: 'lamp3', x: 28, y: 19, name: 'Oil lamp', emoji: '🏮', questId: 'lamps' },
        { id: 'letter1', x: 32, y: 6, name: 'Sealed letter', emoji: '✉️', questId: 'letters' },
        { id: 'letter2', x: 12, y: 20, name: 'Sealed letter', emoji: '✉️', questId: 'letters' },
        { id: 'letter3', x: 6, y: 9, name: 'Sealed letter', emoji: '✉️', questId: 'letters' },
        { id: 'scroll-riv', x: 35, y: 12, name: 'Scroll of the River', emoji: '📜',
          codex: { title: 'By the Rivers of Babylon', text: 'Psalm 137: the exiles weep, remembering Zion. Babylon’s hanging gardens were a wonder of the world — yet God’s people learned that home is not a place but a promise.' } }
      ],
      quests: [
        { id: 'lamps', name: '🏮 Lamps in Exile', giver: 'daniel',
          briefing: 'Gather 3 oil lamps, then return to Daniel.',
          steps: [{ text: 'Gather lamps', need: 3 }, { text: 'Return to Daniel', talk: 'daniel' }],
          reward: { light: 14, codex: { title: 'Daniel’s Open Window', text: 'Daniel 6:10 — exiled, threatened, Daniel still kneels three times a day facing Jerusalem. Faithfulness is mostly a schedule kept when no one applauds.' } } },
        { id: 'letters', name: '✉️ Jeremiah’s Letters', giver: 'scribe',
          briefing: 'Deliver hope: carry 3 letters, then return to the Scribe.',
          steps: [{ text: 'Carry letters', need: 3 }, { text: 'Return to the Scribe', talk: 'scribe' }],
          reward: { light: 14, codex: { title: 'Seek the City’s Welfare', text: 'Jeremiah 29: to exiles in Babylon God says: build houses, plant gardens, marry — and "seek the welfare of the city." Bloom where you are planted, even in exile.' } } },
        { id: 'still', name: '🦁 Be Still', giver: 'daniel',
          briefing: 'Drive back 2 shadows. The lions’ den taught Daniel: stillness is strength.',
          steps: [{ text: 'Defeat shadows', slay: 2 }],
          reward: { light: 14, codex: { title: 'The Lions’ Den', text: 'Daniel 6: a night among hungry lions — and not a scratch. Darius the king cannot sleep; Daniel can. Peace is the real miracle in the den.' } } }
      ],
      trial: {
        title: '⏳ Order the Exile',
        events: ['Carried to Babylon', 'The writing on the wall', 'The lions’ den', 'Return under Cyrus'],
        note: 'The road to the upper room sleeps until the ages stand in order.'
      },
      next: 'church',
      thread: 'The kingdom fell and the temple burned. Yet even in Babylon, lamps still burn — and a king will send them home.',
      intro: {
        date: '586–538 BC',
        facts: [
          'Babylon was the New York of the ancient world — the hanging gardens were counted among its wonders.',
          'Daniel served pagan kings for 70 years without bending; his open window faced Jerusalem three times a day.',
          'In 538 BC Cyrus of Persia let the exiles return — his decree is confirmed by archaeology’s Cyrus Cylinder.'
        ],
        verse: 'Jeremiah 29:11 — "For I know the plans I have for you... plans to prosper you and not to harm you, plans to give you hope and a future."'
      }
    },
    {
      id: 'church', name: 'The Early Church', sub: 'To the ends of the earth', sky: [52, 28, 58],
      ground: ['#6a7c4f', '#5f7047'], water: '#4cc9f0', accent: '#f9c74f',
      map: [
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'T......................................T',
        'T......H...........H...........F.......T',
        'T............R...............R.........T',
        'T...................***..........R.....T',
        'T......................................T',
        'T........W.................H...........T',
        'T...............F........F.............T',
        'T.....R.......................R........T',
        'T......................................T',
        'T.....................H........H.......T',
        'T..........***................R........T',
        'T.........................H....***.....T',
        'T.......R...................R..........T',
        'T......................................T',
        'T.................R..........R.........T',
        'T...........~~~.............~~~........T',
        'T..........~~~~.............~~~~.......T',
        'T...........~~~.............~~~........T',
        'T......................................T',
        'T.........H.................H..........T',
        'T...............................o......T',
        'T.............R.............R..........T',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT'
      ],
      playerStart: { x: 5, y: 19 },
      foes: [{ x: 30, y: 9 }, { x: 8, y: 16 }],
      npcs: [
        { id: 'stephen', x: 18, y: 5, name: 'Stephen', emoji: '😇', color: '#f9c74f',
          lines: ['They are hungry again — always hungry! And glad, always glad.', 'Gather 4 baskets of bread for the fellowship meal. No one eats alone here.'],
          quest: 'bread' },
        { id: 'mary', x: 27, y: 13, name: 'Mary', emoji: '🙏', color: '#e0aaff',
          lines: ['I have kept all these things in my heart since Bethlehem.', 'Tell Paul what you have seen — every witness matters.'] },
        { id: 'paul', x: 12, y: 20, name: 'Paul', emoji: '📜', color: '#90be6d',
          lines: ['From persecutor to preacher — grace has a sense of humor.', 'Wolves circle the young flock. Drive back 2 shadows with E, then tell Stephen all is well.'],
          quest: 'wolves' }
      ],
      relics: [
        { id: 'bread1', x: 19, y: 4, name: 'Bread', emoji: '🍞', questId: 'bread' },
        { id: 'bread2', x: 12, y: 11, name: 'Bread', emoji: '🍞', questId: 'bread' },
        { id: 'bread3', x: 28, y: 12, name: 'Bread', emoji: '🍞', questId: 'bread' },
        { id: 'bread4', x: 20, y: 19, name: 'Bread', emoji: '🍞', questId: 'bread' },
        { id: 'scroll-fire', x: 34, y: 21, name: 'Scroll of Fire', emoji: '📜',
          codex: { title: 'Wind and Fire', text: 'Acts 2: a sound like violent wind, tongues as of fire, and suddenly Galileans speak a dozen languages. Three thousand believe in one day — the church’s birthday party.' } }
      ],
      quests: [
        { id: 'bread', name: '🍞 The Fellowship Meal', giver: 'stephen',
          briefing: 'Gather 4 baskets of bread, then return to Stephen.',
          steps: [{ text: 'Gather bread', need: 4 }, { text: 'Return to Stephen', talk: 'stephen' }],
          reward: { light: 14, codex: { title: 'Breaking Bread', text: 'Acts 2:42-47 — the first Christians share meals "with glad and generous hearts." The Lord’s Supper begins as supper: ordinary food made holy by sharing.' } } },
        { id: 'tongues', name: '🔥 Every Tongue', giver: 'stephen',
          briefing: 'Carry the witness: Stephen → Mary → Paul → Stephen.',
          steps: [{ text: 'Hear Stephen', talk: 'stephen' }, { text: 'Tell Mary', talk: 'mary' }, { text: 'Tell Paul', talk: 'paul' }, { text: 'Return to Stephen', talk: 'stephen' }],
          reward: { light: 14, codex: { title: 'To the Ends of the Earth', text: 'Acts 1:8 gives the whole plot: Jerusalem, Judea, Samaria, "to the end of the earth." The book of Acts never really ends — chapter 29 is being written now.' } } },
        { id: 'wolves', name: '🐺 Guard the Flock', giver: 'paul',
          briefing: 'Drive back 2 shadows, then tell Stephen.',
          steps: [{ text: 'Defeat shadows', slay: 2 }, { text: 'Tell Stephen', talk: 'stephen' }],
          reward: { light: 14, codex: { title: 'Wolves Among Sheep', text: 'Acts 20:29 — Paul warns that wolves will come. The shepherd’s answer is older than armor: stay awake, stay together, and strike when darkness closes in.' } } }
      ],
      trial: {
        title: '⏳ Order the Church',
        events: ['The upper room', 'Wind and fire', 'Three thousand believe', 'To the ends of the earth'],
        note: 'The final seal. Order the ages to witness the dawn.'
      },
      next: null,
      thread: 'Cross, tomb, upper room. The story that began in a garden has grown to the ends of the earth — and it is still being written.',
      intro: {
        date: 'AD 30 and onward',
        facts: [
          'At Pentecost, wind and fire fall on 120 believers; Peter preaches once and 3,000 are baptized — in a single day.',
          'The first Christians share meals "with glad and generous hearts" (Acts 2:46) — the church begins at a table.',
          'Acts 1:8 gives the whole plot: Jerusalem, Judea, Samaria, "to the end of the earth." Chapter 29 is being written now.'
        ],
        verse: 'Acts 1:8 — "You will be my witnesses in Jerusalem and in all Judea and Samaria, and to the end of the earth."'
      }
    }
  ]
};

/* Normalize: pad ragged rows with the border tile so every map is rectangular. */
(function () {
  var A = window.ATLAS;
  A.eras.forEach(function (e) {
    var w = Math.max.apply(null, e.map.map(function (r) { return r.length; }));
    var b = e.map[0][0];
    e.map = e.map.map(function (r) { while (r.length < w) r += b; return r; });
    (e.quests || []).forEach(function (q) { q.era = e.id; });
  });
})();
