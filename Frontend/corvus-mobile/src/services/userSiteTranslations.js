/**
 * Corvus User Site Multilingual Translation Engine
 * Supports: English ('EN'), Shona ('SN'), Ndebele ('ND')
 *
 * Provides translation dictionaries and resolution helpers for:
 * 1. UI Navigation, Headers, Tabs, and Buttons
 * 2. News Article Directory & Full Reader Views (including authentic translations of published articles)
 * 3. Confidential Lead Submission Forms ('Submit a Lead')
 * 4. User Posts & Submission Tracking ('My Posts')
 */

export const LANGUAGES = [
  { code: 'EN', name: 'EN – English', nativeName: 'English' },
  { code: 'SN', name: 'SN – Shona (ChiShona)', nativeName: 'ChiShona' },
  { code: 'ND', name: 'ND – Ndebele (IsiNdebele)', nativeName: 'IsiNdebele' },
];

export const UI_TRANSLATIONS = {
  EN: {
    // Brand & Header
    brandTitle: 'CORVUS',
    brandKicker: 'EDITORIAL DESK',
    selectLanguage: 'Select language',
    languageLabel: 'Language:',
    workspaceBtn: 'NEWSROOM WORKSPACE →',
    openWorkspaceBtn: 'OPEN NEWSROOM WORKSPACE →',
    signInBtn: 'REPORTER SIGN IN',

    // Navigation Tabs
    navNews: 'NEWS ARTICLES',
    navSubmit: 'SUBMIT A LEAD',
    navPosts: 'POSTS',

    // News Articles Page
    newsBannerKicker: 'DISPATCHES & INVESTIGATIVE REPORTS',
    newsBannerSubtitle:
      'Live editorial reporting and verified dispatches from the Corvus newsroom network.',
    searchPlaceholder: 'Search articles by headline or topic...',
    categoriesTitle: 'DESKS & TOPICS',
    allCategories: 'All',
    catLocalNews: 'Local News',
    catTechnology: 'Technology',
    catTransit: 'Transit',
    catEnvironment: 'Environment',
    catEducation: 'Education',
    catPolitics: 'Politics',
    catInvestigation: 'Investigation',
    leadInvestigationBadge: 'LEAD INVESTIGATION',
    readArticleBtn: 'Read Full Investigation →',
    backToDispatches: '← BACK TO ALL DISPATCHES',
    bylinePrefix: 'By',
    photoDeskPrefix: 'PHOTO DESK:',
    sourcesHeading: 'VERIFIED SOURCES & EVIDENCE DOSSIER',
    relatedHeading: 'RELATED INVESTIGATIONS & DISPATCHES',
    noArticlesFound: 'No articles found matching your criteria.',
    minRead: 'min read',

    // Submit Lead Page
    submitTitle: 'Share Your Story',
    submitSubtitle:
      'Submit confidential leads, documents, and eyewitness accounts directly to our investigative journalists.',
    step1Title: '1. Headline / Summary *',
    step1Placeholder: 'Brief, descriptive title of what occurred...',
    step2Title: '2. Comprehensive Details & Evidence *',
    step2Placeholder:
      'Provide an objective, chronological summary of events, dates, involved institutions, and key individuals...',
    step3Title: '3. Editorial Desk & Urgency',
    deskLabel: 'Editorial Desk',
    urgencyLabel: 'Urgency Level',
    step4Title: '4. Geographic Location',
    locationPlaceholder: 'Ward, city, district, or landmark...',
    step5Title: '5. Eyewitness & Document Verification',
    eyewitnessCheckbox: 'I am a direct eyewitness to these events',
    evidenceCheckbox: 'I possess supporting records or documentation',
    evidenceNotesPlaceholder:
      'Describe supporting records (e.g. municipal receipts, water samples, official notices)...',
    step6Title: '6. Anonymity & Reporter Contact',
    anonymousCheckbox: 'Keep my submission completely anonymous',
    anonymousNotice:
      'Your identity and contact info will never be revealed or published. Corvus protects source confidentiality.',
    contactPlaceholder: 'Email or phone for confidential follow-up...',
    submitBtn: 'SUBMIT LEAD TO EDITORIAL TEAM',
    submittingBtn: 'Submitting to Newsroom...',
    submitSuccessTitle: 'Lead Successfully Submitted',
    submitSuccessMessage:
      'Your report has been securely transmitted to the newsroom desk under reference:',
    submitAnotherBtn: 'Submit Another Lead',
    viewInPostsBtn: 'View My Submissions →',
    errFillRequired: 'Please complete all required fields indicated in the form.',

    // Urgency Options
    urgencyTip: 'Lead Tip',
    urgencyDeveloping: 'Developing Story',
    urgencyBreaking: 'Breaking News',

    // Posts Page
    postsTitle: 'Editorial Leads & Draft History',
    postsSubtitle:
      'Track the review workflow and editorial status of your submitted investigative leads.',
    filterAll: 'My Posts',
    filterDrafts: 'Drafts',
    filterSubmitted: 'Submitted',
    filterUnderReview: 'Under Review',
    filterPublished: 'Published',
    filterRejected: 'Rejected',
    noPostsMessage: 'No submissions found in this category.',
    submitFirstLeadBtn: 'Submit a New Lead',
    postDetailTitle: 'Submission Dossier',
    postStatusLabel: 'Status:',
    postDeskLabel: 'Desk:',
    postDateLabel: 'Submitted:',
    postLocationLabel: 'Location:',
    postContactLabel: 'Contact Details:',
    postDetailsHeading: 'Story Description & Findings',
    postEvidenceHeading: 'Evidence & Verification Notes',
    closeBtn: 'Close',
  },

  SN: {
    // Brand & Header
    brandTitle: 'CORVUS',
    brandKicker: 'DHESIKI REVATORI VENHAU',
    selectLanguage: 'Sarudza Mutauro',
    languageLabel: 'Mutauro:',
    workspaceBtn: 'HORO YEVATORI VENHAU →',
    openWorkspaceBtn: 'VHIVHA HORO YEVATORI VENHAU →',
    signInBtn: 'PINDA SEMUTORI WENHAU',

    // Navigation Tabs
    navNews: 'NHAU NEZVAKANYORWA',
    navSubmit: 'TUMIRA CHIRATIDZO',
    navPosts: 'ZVANDANYORA',

    // News Articles Page
    newsBannerKicker: 'MISHOPHO NENHAU DZEKUONGORORA',
    newsBannerSubtitle:
      'Nhau dzechokwadi nekuongorora kwakadzama kubva kune vatori venhau veCorvus.',
    searchPlaceholder: 'Tsvaga nhau nemusoro wenyaya kana dingindira...',
    categoriesTitle: 'ZVIKAMU ZVENHAU',
    allCategories: 'Zvose',
    catLocalNews: 'Nhau dzeMuno',
    catTechnology: 'Unyanzvi neTekinoroji',
    catTransit: 'Zvekufambisa',
    catEnvironment: 'Zvemamiriro Ekunze',
    catEducation: 'Zvedzidzo',
    catPolitics: 'Zvematongerwo Enyika',
    catInvestigation: 'Kuongorora Kwakadzama',
    leadInvestigationBadge: 'NHAU HURU YEONGORORO',
    readArticleBtn: 'Verenga Nhau Yese Yakadzama →',
    backToDispatches: '← DZOKERA KUNHAU DZOSE',
    bylinePrefix: 'Na',
    photoDeskPrefix: 'DHESIKI REMIFANIDZO:',
    sourcesHeading: 'ZVINYORWA NEUFAKAZI HWECHOKWADI HWAKAONGORORWA',
    relatedHeading: 'DZIMWE NHAU DZEKUONGORORA DZIINE CHEKUITA NEIYI',
    noArticlesFound: 'Hapana nhau dzawanikwa dzinoenderana nezvatsvagwa.',
    minRead: 'miniti yekuverenga',

    // Submit Lead Page
    submitTitle: 'Govera Nhau Yako',
    submitSubtitle:
      'Tumira mashoko akavanzika, magwaro, nezvakaonekwa nemaziso zvakananga kuvatori venhau vedu vanoongorora.',
    step1Title: '1. Musoro WeNhau / Muchidimbu *',
    step1Placeholder: 'Musoro mupfupi unotsanangura zvakaitika...',
    step2Title: '2. Tsanangudzo Yakazara Neufakazi *',
    step2Placeholder:
      'Nyorai zvakaitika zvakarongeka nemazuva, masangano ane chekuita nazvo, nevanhu vanobatanidzwa...',
    step3Title: '3. Dhesiki reNhau neKukurumidza',
    deskLabel: 'Dhesiki reNhau',
    urgencyLabel: 'Mwero weKukurumidza',
    step4Title: '4. Nzvimbo Yakaitikira Nhau',
    locationPlaceholder: 'Wadhi, guta, dunhu, kana nzvimbo inozivikanwa...',
    step5Title: '5. Ufakazi hweVakaona neGwaro',
    eyewitnessCheckbox: 'Ndakaona zvichiitika nemaziso angu',
    evidenceCheckbox: 'Ndine magwaro kana zvinyorwa zvinotsigira nhau iyi',
    evidenceNotesPlaceholder:
      'Tsanangurai magwaro anawo (semuenzaniso: marisiti ekanzuru, mvura yakaedzwa, matsamba epamutemo)...',
    step6Title: '6. Kuzvichengetedza Kuvanzika neKutaura neMunyori',
    anonymousCheckbox: 'Chengetedzai zita rangu rakavanzika zvachose',
    anonymousNotice:
      'Zita renyu nenhamba dzenhare hazvingambobuditswe pachena. Corvus inochengetedza vanopa mashoko.',
    contactPlaceholder: 'Email kana nhamba dzenhare dzekubata nadzo pakavanzika...',
    submitBtn: 'TUMIRA NHAU KUDHESIKI REVENHAU',
    submittingBtn: 'Zvirikutumirwa kudhesiki...',
    submitSuccessTitle: 'Nhau Yatumirwa Zvakabudirira',
    submitSuccessMessage:
      'Mashoko enyu atumirwa zvakanaka kuvatori venhau vachishandisa nhamba yeongororo inoti:',
    submitAnotherBtn: 'Tumira Imwe Nhau',
    viewInPostsBtn: 'Ona Zvawatumira →',
    errFillRequired: 'Ndapota zadzisai zvikamu zvose zvinodiwa mufomu iyi.',

    // Urgency Options
    urgencyTip: 'Chiratidzo cheNhau',
    urgencyDeveloping: 'Nhau Inoramba Ichikura',
    urgencyBreaking: 'Nhau Yekukasika / Inopisa',

    // Posts Page
    postsTitle: 'Nhau Dzakatumirwa neGwaro reOngororo',
    postsSubtitle:
      'Teverai mamiriro ekuongororwa kwemashoko enyu akatumirwa kudhesiki revatori venhau.',
    filterAll: 'Zvose Zvangu',
    filterDrafts: 'Zvisina Kupedzwa',
    filterSubmitted: 'Zvakatumirwa',
    filterUnderReview: 'Zvirikuongororwa',
    filterPublished: 'Zvakabudiswa',
    filterRejected: 'Zvisina Kubvumidzwa',
    noPostsMessage: 'Hapana zvakatumirwa zvawanikwa muchikamu ichi.',
    submitFirstLeadBtn: 'Tumira Nhau Itsva',
    postDetailTitle: 'Gwaro reNhau Yakatumirwa',
    postStatusLabel: 'Mamiriro:',
    postDeskLabel: 'Dhesiki:',
    postDateLabel: 'Zuva Rakatumirwa:',
    postLocationLabel: 'Nzvimbo:',
    postContactLabel: 'Mashoko eKutaura Nawo:',
    postDetailsHeading: 'Tsanangudzo yeNhau neZvakaongororwa',
    postEvidenceHeading: 'Ufakazi neMashoko eKusimbisa',
    closeBtn: 'Vhara',
  },

  ND: {
    // Brand & Header
    brandTitle: 'CORVUS',
    brandKicker: 'IDESKI LEZINDABA',
    selectLanguage: 'Khetha Ulimi',
    languageLabel: 'Ulimi:',
    workspaceBtn: 'INDAWO YABANTU BEZINDABA →',
    openWorkspaceBtn: 'VULA INDAWO YABANTU BEZINDABA →',
    signInBtn: 'NGENA NJENGOMBIKI',

    // Navigation Tabs
    navNews: 'IZINDABA',
    navSubmit: 'THUMELA INDABA',
    navPosts: 'ENGIKUBHALILEYO',

    // News Articles Page
    newsBannerKicker: 'IMIBIKO YOCWANINGO LWEZINDABA',
    newsBannerSubtitle:
      'Imibiko eqondileyo yeqiniso kanye locwaningo olunzulu oluvela edeskini leCorvus.',
    searchPlaceholder: 'Dinga izindaba ngesihloko loba ngodaba...',
    categoriesTitle: 'IZIGABA ZEZINDABA',
    allCategories: 'Konke',
    catLocalNews: 'Izindaba Zakuleli',
    catTechnology: 'Ezetheknoloji',
    catTransit: 'Ezokuthutha',
    catEnvironment: 'Ezomhlaba Lemvelo',
    catEducation: 'Ezemfundo',
    catPolitics: 'Ezombusazwe',
    catInvestigation: 'Ucwaningo Olunzulu',
    leadInvestigationBadge: 'INDABA ENGUNDLUNKULU YOCWANINGO',
    readArticleBtn: 'Funda Indaba Yonke Ngokugcweleyo →',
    backToDispatches: '← BUYELA KUZINDABA ZONKE',
    bylinePrefix: 'Ngu',
    photoDeskPrefix: 'IDESKI LEMIFANEKISO:',
    sourcesHeading: 'IMITHOMBO LOBUFAKAZI OBUQINISEKIWEYO',
    relatedHeading: 'EZINYE IZINDABA ZOCWANINGO EZIHAMBELANA LALE',
    noArticlesFound: 'Akulamibiko etholakeleyo ehambelana lalokho okudingayo.',
    minRead: 'imizuzu yokufunda',

    // Submit Lead Page
    submitTitle: 'Yabelana Ngendaba Yakho',
    submitSubtitle:
      'Thumela imfihlo, amaphepha obufakazi, lokubone ngamehlo akho ngqo kubabhali bethu bezindaba zocwaningo.',
    step1Title: '1. Isihloko / Kafushane *',
    step1Placeholder: 'Isihloko esifitshane esichaza okwenzakeleyo...',
    step2Title: '2. Ingxoxo Egcweleyo Lobufakazi *',
    step2Placeholder:
      'Bhala okwenzakeleyo kuhle kuhlanganisa izinsuku, inhlangano ezithintekayo, kanye labantu abakhona...',
    step3Title: '3. Ideski yeZindaba lokuQakatheka',
    deskLabel: 'Ideski yeZindaba',
    urgencyLabel: 'Ukuqakatheka',
    step4Title: '4. Indawo Yokwenzakala',
    locationPlaceholder: 'Iwodi, idolobho, isigaba loba indawo eyaziwayo...',
    step5Title: '5. Ubufakazi Bababone Ngamehlo Lamaphepha',
    eyewitnessCheckbox: 'Ngibone ngamehlo ami kusenzakala',
    evidenceCheckbox: 'Ngilamaphepha loba ubufakazi obusekela leli zwi',
    evidenceNotesPlaceholder:
      'Chaza amaphepha obufakazi olawo (isibonelo: amarisidi edolobho, amanzi ahloliweyo, izaziso ezisemthethweni)...',
    step6Title: '6. Ukungazivezi Lobudlelwano Lombiki',
    anonymousCheckbox: 'Gcina ibizo lami lifihlekile ngokupheleleyo',
    anonymousNotice:
      'Ibizo lakho lenombolo yocingo azisoze zidalulwe ebantwini. I-Corvus ivikela abathumela izindaba.',
    contactPlaceholder: 'I-imeyili loba inombolo yocingo yokuxhumana ngasese...',
    submitBtn: 'THUMELA UDABA EDESKINI LEZINDABA',
    submittingBtn: 'Kuthunyelwa kudeski lezindaba...',
    submitSuccessTitle: 'Udaba Luthunyelwe Ngempumelelo',
    submitSuccessMessage:
      'Imbiko yakho isithunyelwe ngokuvikelekileyo edeskini lezindaba ngaphansi kwenombolo ethi:',
    submitAnotherBtn: 'Thumela Olunye Udaba',
    viewInPostsBtn: 'Bona Okuthumeleyo →',
    errFillRequired: 'Sicela ugcwalise zonke indawo ezidingekayo kuleli fomu.',

    // Urgency Options
    urgencyTip: 'Ulwazi Olulutho',
    urgencyDeveloping: 'Indaba Esaqhubeka',
    urgencyBreaking: 'Izindaba Ezitshisayo / Eziphuthumayo',

    // Posts Page
    postsTitle: 'Izindaba Ezithunyelweyo Lamarekhodi Ocwaningo',
    postsSubtitle:
      'Landela inqubo yokuhlolwa lokuqinisekiswa kwezindaba ozithumele kudeski lezindaba.',
    filterAll: 'Okwami Konke',
    filterDrafts: 'Okusaqediweyo',
    filterSubmitted: 'Okuthunyelweyo',
    filterUnderReview: 'Okusahlolwayo',
    filterPublished: 'Okushicilelweyo',
    filterRejected: 'Okungamukelwanga',
    noPostsMessage: 'Akukho okutholakeleyo kulesi sigaba.',
    submitFirstLeadBtn: 'Thumela Udaba Olutsha',
    postDetailTitle: 'Iphepha Lezindaba Ezithunyelweyo',
    postStatusLabel: 'Isimo:',
    postDeskLabel: 'Ideski:',
    postDateLabel: 'Usuku:',
    postLocationLabel: 'Indawo:',
    postContactLabel: 'Okokuxhumana:',
    postDetailsHeading: 'Ingxoxo Egcweleyo Lokutholakeleyo',
    postEvidenceHeading: 'Ubufakazi Lokuhlola',
    closeBtn: 'Vala',
  },
};

/**
 * Authentic, human-grade journalistic article translations
 * for all published newsroom articles.
 */
export const ARTICLE_TRANSLATIONS = {
  SN: {
    'art-1': {
      title: 'Kuongorora: Zvivakwa Zvekugoverwa KweMvura neKushaikwa Kwayo Mumaguta',
      category: 'Nhau dzeMuno',
      authorRole: 'Mutori weNhau Mukuru weKuongorora',
      caption:
        'Mapaipi makuru ekugovera mvura achichinjwa nekukasika munzvimbo dzekumabvazuva kweguta.',
      excerpt:
        'Kuongorora kwakadzama pamapaipi makuru emvura ekanzuru kunoratidza matambudziko ekunonoka kugadzirisa, kuderera kwekumanikidza kwemvura pasina chiziviso, nekubatsirana kwevagari munzvimbo dzemaguta.',
      content: `Vagari vemunzvimbo dzekumabvazuva kwemaguta vave nemavhiki matanhatu vachishungurudzika nekushaikwa kwemvura yakachena yekunwa, izvo zvakaita kuti vakuru vekanzuru vaite misangano yekukurumidza nenyanzvi dzezvekuvaka nemapaipi.

Ongororo yakaitwa munzvimbo nhatu dzinogoverwa mvura yakawana kuti kuderera kwesimba remvura kunoitika nguva zhinji panosangana mapombi makuru. Nyanzvi dzakati dambudziko guru riri pamapaipi akaiswa makore anopfuura makumi mana apfuura ayo akasakadzwa nekuputika kwenyika panguva dzekupisa nekunaya.

Maererano nemabhuku ekanzuru akaongororwa neCorvus, kugadziriswa kwepombi huru kwakambomiswa kaviri mukota yapfuura nekuda kwekunonoka kusvika kwezvikamu zvitsva zvinodzora simba remvura. Izvi zvakaita kuti vagari vaumbe makomiti ekuongorora kuchena kwemvura nekubatsirana kuronga marori anounza mvura munzvimbo dzavo.

Dare renyanzvi dzekanzuru rakazivisa kuti chirongwa chekugadzirisa mapaipi chichatanga mukati memavhiki maviri anotevera, chichitanga nezvipatara nemisha yevanhu chisati chatekeshera kune dzimwe nzvimbo dzese.`,
      sources:
        'Magwaro ekanzuru ezvekugadzirisa zvinhu, uchapupu hwenyanzvi dzedunhu, uye miedzo yekuchena kwemvura yakaitwa musi wa2 Mbudzi 2026.',
      readTime: 'Maminitsi 6 ekuverenga',
    },
    'art-2': {
      title:
        'Unyanzvi hweAI neZviongorori Zvekurima Zvinoshandura Zvekufembera Kukohwa Kwevarimi Vadiki',
      category: 'Unyanzvi neTekinoroji',
      authorRole: 'Dhesiki reTekinoroji neZvekurima',
      caption: 'Nyanzvi dzezvekurima dzichiisa michina yeongororo yemvura muvhu pamunda wekuratidzira.',
      excerpt:
        'Miedzo inosanganisa michina yeongororo yemagetsi nenharembozha dzemutauro wepamusha iri kubatsira varimi kufembera kusanaya kwemvura nekuronga goho ravo zvakanaka.',
      content: `Chikwata chevaongorori vezvekurima mumatunhu akasiyana chakaisa michina midiki inoongorora ivhu munzvimbo makumi maviri nembiri dzevarimi vanoshandira pamwe, vachiuya neruzivo rwekufembera mamiriro ekunze zvakananga kuvarimi vekumaruwa.

Michina iyi inoramba ichitevera hunyoro hwemuvhu, kupisa kwemhepo, nemamiriro ekunze, ichitumira mashoko kuburikidza nenharembozha kune dura reruzivo riri pachena. Nyanzvi dzezvekurima dzinoshandura mashoko aya kuenda mumazano anonzwisisika anoparadzirwa neShona, Ndebele, neChirungu.

Pakutanga kwemwaka wekurima uyu, varimi vanoshandisa zviratidzo izvi vakanonotsa kudyara nemazuva gumi nerimwe, izvo zvakadzivirira kuti mbeu dzisatsve nekupisa kwezuva kwekutanga. Vatungamiri vechirongwa vanoronga kuwedzera michina iyi kumatandiro emvura yezvipfuyo mwaka wekusanaya kwemvura usati wasvika.`,
      sources:
        'Gwaro reRegional Agronomy Collaborative 2026; ongororo yemuminda kuMashonaland neMatabeleland.',
      readTime: 'Maminitsi 4 ekuverenga',
    },
    'art-3': {
      title: 'Kuvandudzwa Kwezvitima Zvevafambi: Zvirongwa Zvemagetsi neNguva dzekufamba',
      category: 'Zvekufambisa',
      authorRole: 'Mutori weNhau weZvivakwa zveMuguta',
      caption: 'Chiteshi chezvitima chemuguta panguva yekuyedzwa kwekufamba kwevafambi mangwanani.',
      excerpt:
        'Vakaronga vezvekufambisa vanobudisa ongororo yemamiriro ekunze nenzira dzezvitima zvemagetsi zvinotakura vanhu vakawanda kuitira kurerutsa kuungana kwemotokari mumigwagwa mikuru.',
      content: `Nzira dzinofamba vafambi vemumaguta dzakatarisana nekugadziridzwa kukuru zvichitevera chirongwa chitsva chezvitima chekufambisa vanhu chakaiswa kudare rezvekufambisa svondo rino.

Chirongwa ichi chinoratidza kuunzwa kwezvitima zvinoshandisa magetsi nedhiziri zvakagadzirirwa kufamba munzira dzinorema dzinobatanidza misha iri kunze kweguta nenzvimbo dzinovigwa mabhizinesi makuru. Zvitima izvi zviri kutarisirwa kutakura vanhu vakapetwa katatu pane zvinotakurwa pari zvino, uku zvichideredza nguva yekufamba nemaminitsi makumi maviri nemana.

Ongororo yemari inoratidza kuti zvinodiwa pakuvaka zvichabhadharwa nerubatsiro rwezvirongwa zvekufambisa zvakachena. Misangano nevagari pamusoro penzvimbo dzekusiyira motokari nemabhazi madiki yakarongwa kuitwa mumatunhu ose mwedzi uno.`,
      sources: 'Gwaro reMinistry of Transport Preliminary Railway Feasibility Dossier (Ref: TR-2026-088).',
      readTime: 'Maminitsi 5 ekuverenga',
    },
    'art-4': {
      title: 'Kudyarwa Kwezvirimwa neMiti Kunodzivirira Masango eMakomo eMabvazuva',
      category: 'Zvemamiriro Ekunze',
      authorRole: 'Mupepeti weZvemamiriro Ekunze',
      caption: 'Miti yemuno ichidimburirwa nekurimwa munzira dzemvura kuitira kusimbisa mahombekombe enzizi.',
      excerpt:
        'Masangano anochengetedza masango anotaura nezvekumutsidzirwa kwemiti yemuno nekuderera kwevhu rinokukurwa kuenda munzizi dzinopa mvura mumakomo.',
      content: `Makore mashanu mushure mekunge kutemwa kwemiti zvisiri pamutemo kwaparadza masango emumakomo, chirongwa chakabatana chekugadzirisa zvisikwa chakadzorera miti pamahekita ane chiuru nemazana masere (1,800) enzvimbo dzemakomo.

Vatariri vemasango vomumisha vakashanda pamwe chete nenyanzvi dzezvirimwa vakadyara miti yemuno inodarika zviuru zana nemakumi mana (140,000), vachikoshesa miti ine midzi yakadzika inodzivirira kuteremuka kwevhu. Ongororo yemudenga yakasimbisa kuti ivhu rinoerera mudhamu dzekudiridza raderera nezvikamu makumi matatu nezviviri kubva muzana (32%).

Kuongororwa kwemvura panzvimbo dzinotorerwa mvura kurwizi kunoratidza kudzika nekugadzikana kwekuyerera kwemvura gore rose, zvichipa varimi vezvirimwa mvura yakavimbika kunyangwe panguva dzekupisa kwezuva.`,
      sources: 'Ongororo yegore yeEastern Highlands Watershed Conservation Conservancy, Gumiguru 2026.',
      readTime: 'Maminitsi 5 ekuverenga',
    },
    'art-5': {
      title: 'Zvirongwa Zvedzidzo Zvemadhijitari Nemitauro Miviri Mumazvikoro Epasi',
      category: 'Zvedzidzo',
      authorRole: 'Dhesiki reMitemo yeDzidzo',
      caption: 'Vana vepapuraimari vachishandisa michina yemadhijitari ine mitauro yemuno pakuverenga.',
      excerpt:
        'Zvirongwa zvemunzvimbo zvinosanganisa kudzidzisa nemitauro yemuno pamwe chete nesainzi zvinoratidza kubatsira vana kubata mashoko nekuverenga masvomhu nekukasika.',
      content: `Chirongwa chedzidzo chinosanganisa kudzidzisa panguva imwe chete neShona, Ndebele, neChirungu chakaunzwa muzvikoro makumi mana nesere zvakasarudzwa zvichitevera miedzo yakabudirira mumatunhu akasiyana.

Vaongorori vezvedzidzo vakacherechedza kuti vana vanotanga kudzidziswa mashoko esainzi nemasvomhu nemutauro wavo wepamusha vasati vaenda kuChirungu vanobata zvinhu nekukurumidza nezvikamu makumi mana kubva muzana (40%) kudarika vaya vanodzidziswa neChirungu chete kubva pakutanga.

Bazi redzidzo rinoronga kupa mahwendefa emadhijitari anochajwa nezuva ane zvidzidzo zvemukati kune zvimwe zvikoro zana zvekumaruwa gore idzva rechikoro risati ratanga.`,
      sources:
        'Ongororo yeNational Curriculum Development Institute; kuongororwa kwemuminda mumatunhu akaedzwa chirongwa.',
      readTime: 'Maminitsi 4 ekuverenga',
    },
    'art-6': {
      title: 'Komiti yeParamende Inoda Kujeka Muzvibvumirano Zvezvicherwa',
      category: 'Zvematongerwo Enyika',
      authorRole: 'Mukuru weHofisi yeParamende',
      caption: 'Horo dzekomiti yeparamende panguva yekuteerera pfungwa dzeruzhinji pamusoro pemigodhi.',
      excerpt:
        'Vamiriri veparamende vanoisa chisungo chekuti zvibvumirano zvese zvekuchera zvicherwa zvinodarika mamiriyoni gumi emadhora zvibuditswe pachena.',
      content: `Mumusangano wakakosha weparamende, Komiti yeMines and Energy yakavhotera pamwe chete kuti zvibvumirano zvese zvezvicherwa zvinodarika mamiriyoni gumi emadhora zvinofanira kunyorwa pachena murhejisitari yeruzhinji.

Chisungo ichi chinoti zvibvumirano zvinofanira kunge zvine zvinyorwa zvakajeka zvinoratidza mitero inobhadharwa nemakambani, mubhadharo wenzvimbo, nemari inosara ichienda kumakomiti ebudiriro yemunzvimbo dzine migodhi. Nhengo dzeparamende dzakati kusajeka kwemari kwakadzorera shure makanzuru aiedza kuvaka migwagwa nezvipatara.

Vamiriri vemakambani emigodhi vaive pamusangano uyu vakaratidza kubvumirana neizvi, chero zvichingodzivirira zvisungo zvemashoko akavanzika pamusoro pekuongororwa kwenzvimbo dzezveupfumi huri pasi.`,
      sources: 'Zvinyorwa zveParliamentary Hansard Official Records; Gwaro reKomiti reMines and Energy Nhamba 14.',
      readTime: 'Maminitsi 7 ekuverenga',
    },
  },

  ND: {
    'art-1': {
      title: 'Ucwaningo: Ingqalasizinda Yokuhambisa Amanzi Lokusilela Kwawo Emadolobheni',
      category: 'Izindaba Zakuleli',
      authorRole: 'Umbiki Wezindaba Omkhulu Wocwaningo',
      caption: 'Amaphayiphi amakhulu okuhambisa amanzi ebulungiswa ngokuphazamiseka empumalanga yedolobho.',
      excerpt:
        'Ucwaningo olunzulu emaphayiphini amakhulu edolobho luveza ukulibaziseka kokulungisa, ukwehla kwamandla amanzi kungelabazisi, kanye lemizamo yabahlali yokubambisana.',
      content: `Izakhamizi ezihlala empumalanga yedolobho sezingene evikini lesithupha zibhekane lokuswela amanzi ahlanzekileyo okunatha, okwenze ukuthi abaphathi bedolobho babize umhlangano wamahhala lezingcwethi zamaphayiphi.

Ukuhlola okwenziwe ezigabeni ezintathu zokwabiwa kwamanzi kuveze ukuthi ukwehla kwamandla amanzi kwenzeka kanengi lapho okuhlanganela khona amaphayiphi amakhulu. Izingcwethi zithi inkinga enkulu idalwa ngamaphayiphi afakwa eminyakeni engamashumi amane edluleyo asedilikile ngenxa yokutshintsha kwenhlabathi.

Ngokwezincwadi zedolobho ezihlolwe yi-Corvus, ukulungiswa kwesiteshi esikhulu samanzi kwamiswa kabili ngenxa yokulibaziseka kwezinto zokulungisa ezivela phandle. Lokhu kwenze ukuthi izakhamizi zibumbe amakomiti okuhlola ukuhlanzeka kwamanzi lokuhlela ndawonye amagalani amanzi emizini yazo.

Ikhansili yezokwakha yedolobho yamukele ukuthi umsebenzi wokulungisa amaphayiphi uzangena kumaviki amabili azayo, uqale ezibhedlela lakumizi yabantu ungakayi kwezinye izindawo.`,
      sources:
        'Amarekhodi edolobho okulungisa, ubufakazi bezingcwethi zesigaba, lokuhlola ukuhlanzeka kwamanzi okwenziwe mhlaka 2 Lwezi 2026.',
      readTime: 'Imizuzu engu-6 yokufunda',
    },
    'art-2': {
      title:
        'Ubuchwepheshe be-AI Lezinto Zokuhlola Ezolimo Ziguqula Ukubikezela Kwezivuno Zabafuyi Labalimi Abancane',
      category: 'Ezetheknoloji',
      authorRole: 'Ideski Lezetheknoloji lezoLimo',
      caption: 'Izingcwethi zezolimo zihlola ubuchwepheshe bokuhlola umswakama womhlabathi ensimini yokubonisa.',
      excerpt:
        'Ukuhlanganiswa kwezinto zokuhlola ezincane lokuphathisana ngomakhalekhukhwini ngezilimi zendawo kunceda abalimi abancane ukubikezela isomiso lokulungisa isivuno.',
      content: `Iqembu labacwaningi bezolimo lifake izinto zokuhlola ezincane emaphandleni angamashumi amabili lambili ezigabeni zabalimi, liletha izibikezelo zezulu ngqo kubalimi basemaphandleni.

Lezi zinto zihlola umswakama emhlabathini, izinga lokutshisa komoya, lokugcwala komswakama emoyeni, zithumela imibiko ngomakhalekhukhwini endaweni yokugcina ulwazi evulekileyo. Izingcwethi zezolimo ziguqula lezi zibikezelo zibe yiziluleko ezicacileyo ngesiShona, isiNdebele, lesiNgisi.

Ekuqaleni kwalesi sikhathi sokulima, abalimi abasebenzisa lezi zeluleko batshephisa izinsuku zokuhlanyela ngezinsuku ezilitshumi lanye, okwasindisa inhlanyelo ekutshisweni lilanga lokuqala. Abakhokheli bale phrojekthi bahlose ukwandisa lezi zinto zokuhlola ezizibeni zamanzi ezifuyo ngaphambi kokufika kwesikhathi sesomiso.`,
      sources:
        'Umbiko we-Regional Agronomy Collaborative 2026; ukuhlola emaphandleni aseMashonaland laseMatabeleland.',
      readTime: 'Imizuzu engu-4 yokufunda',
    },
    'art-3': {
      title: 'Ukuthuthukiswa Kwezitimela Zabagibeli: Ugesi Lamahlelo Okuhamba',
      category: 'Ezokuthutha',
      authorRole: 'Umbiki Wezindaba Wezengqalasizinda Yedolobho',
      caption: 'Isiteshi sezitimela zedolobho ngesikhathi sokugibela kwabantu ekuseni kakhulu.',
      excerpt:
        'Abahleli bezokuthutha bamukele ukuhlolwa kwemvelo lemizila yezitimela zikagesi ezithwala abantu abanengi ukunciphisa ukuminyana emigwaqweni emikhulu.',
      content: `Imizila yabagibeli basedolobheni izathuthukiswa kakhulu ngaphansi kohlelo olutsha lwezitimela olwethulwe kubaphathi bezokuthutha kuleli viki.

Lolu hlelo luveza ukufakwa kwezitimela ezisebenza ngogesi ledizili ezihloselwe ukuhamba emizileni ehlanganisa imizi engaphandle kwedolobho lenkabeni yebhizinisi. Izitimela lezi zikhangelelwe ukuthwala abantu ngokuphindwe kathathu kunezamanje, kanti zizanciphisa isikhathi sokuhamba ngemizuzu engamashumi amabili lane.

Ukubalwa kwezimali kuveza ukuthi izindleko zizaphungulwa ngezibonelelo zokuthutha okuhlanzekileyo. Imihlangano lezakhamizi mayelana nezindawo zokupaka izimota lamabhasi izakwenziwa kuyo yonke inyanga.`,
      sources: 'Umbiko we-Ministry of Transport Preliminary Railway Feasibility Dossier (Ref: TR-2026-088).',
      readTime: 'Imizuzu engu-5 yokufunda',
    },
    'art-4': {
      title: 'Ukuhlanyelwa Kwezihlahla Kuvuselela Imvelo Yamagquma Asempumalanga',
      category: 'Ezomhlaba Lemvelo',
      authorRole: 'Umhleli Wezomhlaba Lemvelo',
      caption: 'Izihlahla zomdabu zihlanyelwe eceleni kwemifula ukuvikela ukugugudeka kwebhanka.',
      excerpt:
        'Amapaki ezihlahla athi kukhona ukululama kwezihlahla zemvelo lokuncipha kwenhlabathi egugudekela emifuleni.',
      content: `Ngemva kweminyaka emihlanu ukugawulwa kwezihlahla ngokungekho emthethweni konakele amagquma, uhlelo lokuvuselela imvelo selubuyisele izihlahla kumahekitha angaphezu kwenkulungwane lamakhulu ayisikhombisa (1,800).

Abavikeli bamahlathi basekuhlaleni bebambisene lezingcwethi zezihlahla bahlanyele izihlahla zendabuko ezingaphezu kwenkulungwane ezilikhulu lamatshumi amane (140,000), beqakathekisa izihlahla ezilezimpande ezinzulu ezivikela inhlabathi yamagquma. Ukuhlola okuvela phezulu kuqinisekise ukuthi inhlabathi engena emadamu okuthelela yehle ngamaphesenti angamashumi amathathu lambili (32%).

Ukuhlolwa kwamanzi emifuleni kuveza ukuthula lokuhamba kuhle kwamanzi umnyaka wonke, okwenza abalimi bezilimo bathole amanzi athembekileyo ngitsho langesikhathi sokutshisa.`,
      sources: 'Umbiko wonyaka we-Eastern Highlands Watershed Conservation Conservancy, Mfumfu 2026.',
      readTime: 'Imizuzu engu-5 yokufunda',
    },
    'art-5': {
      title: 'Uhlelo Lwemfundo Yedijithali Ngezilimi Ezimbili Ezikolweni Zamabanga Aphansi',
      category: 'Ezemfundo',
      authorRole: 'Ideski Lezinqubo Zezemfundo',
      caption: 'Abafundi bamabanga aphansi besebenzisa izinto zokubala zedijithali ngezilimi zabo zendabuko.',
      excerpt:
        'Izinhlelo zokuhlola ezihlanganisa ukufundisa ngezilimi zendabuko lesayensi ziveza intuthuko enkulu ekubambeni kwabafundi lakwezibalo.',
      content: `Uhlelo lwezemfundo olufundisa ngesikhathi sinye ngesiShona, isiNdebele, lesiNgisi selwethulwe ezikolweni zamabanga aphansi ezingamashumi amane lasitshiyagalombili kulandela ukuhlolwa okuyimpumelelo ezifundeni ezahlukeneyo.

Abacwaningi bezemfundo baphawule ukuthi abantwana abaqala ukufunda amagama esayensi lezibalo ngolimi lwabo lwasekhaya ngaphambi kokutshintshela esiNgisini babamba izifundo ngokushesha ngamaphesenti angamashumi amane (40%) kunezikhathi zokufunda ngolimi olulodwa lwesilungu kuphela.

Umnyango wezemfundo uhlose ukunikeza amaphilisi edijithali asebenza ngelanga ezikolweni ezilikhulu zasemaphandleni ngaphambi kokuqala komnyaka omusha wezifundo.`,
      sources: 'Umbiko we-National Curriculum Development Institute; ukuhlola emakilasini ezifunda ezihloliweyo.',
      readTime: 'Imizuzu engu-4 yokufunda',
    },
    'art-6': {
      title: 'Ikomidi Yephalamende Ifuna Ukukhanya Ezivumelwaneni Zokumbiwayo',
      category: 'Ezombusazwe',
      authorRole: 'Inhloko Yehofisi Yephalamende',
      caption: 'Amagumbi ekomidi yephalamende ngesikhathi sokulalelwa kwemibono yabantu ngemigodi yokumba.',
      excerpt:
        'Abameli bephalamende bamukele isinqumo sokuthi zonke izivumelwano zokumba ezingaphezulu kwamadola ayizigidi ezilitshumi kumele zidalulwe ebantwini.',
      content: `Emhlanganweni omkhulu wephalamende, iKomidi yeMines and Energy ivote ngazwi linye ukuthi zonke izivumelwano zokumba izinsiza ezedlula amadola ayizigidi ezilitshumi zibhalwe kurejista evulekileyo yomphakathi.

Lesi sinqumo sithi izivumelwano kumele zibe lemininingwane ebonisa intela ekhokhwa ngamankampani, ukukhokhela indawo, lemali ebekelwe ukuthuthukisa imiphakathi ehlala eduze kwemigodi. Amalunga ephalamende agcizelele ukuthi ukungacaci kwemali kuphazamise amakhansili abezama ukwakha imigwaqo lezibhedlela.

Abameli bezimayini ababekhona kule nkulumo-mpikiswano bathe bayasisekela lesi sinqumo, inqobo nje uma kuhlala kuvikelekile imininingwane eqondene lobuchwepheshe bokuhlola umhlabathi.`,
      sources: 'Amarekhodi e-Parliamentary Hansard Official; Umbiko weKomidi yeMines and Energy No. 14.',
      readTime: 'Imizuzu engu-7 yokufunda',
    },
  },
};

/**
 * Resolves a UI string by key and language code.
 * Falls back to English ('EN') if the key or language is missing.
 */
export function t(key, langCode = 'EN') {
  const normalizedLang = (langCode || 'EN').toUpperCase();
  const langDict = UI_TRANSLATIONS[normalizedLang] || UI_TRANSLATIONS.EN;
  if (langDict && key in langDict) {
    return langDict[key];
  }
  return UI_TRANSLATIONS.EN[key] || key;
}

/**
 * Returns a translated version of a news article object.
 * If the article is one of our published articles with full translations,
 * it returns the authentic translated text.
 * Otherwise, it localizes its category and read-time metadata gracefully.
 */
export function getTranslatedArticle(article, langCode = 'EN') {
  if (!article) return article;
  const normalizedLang = (langCode || 'EN').toUpperCase();
  if (normalizedLang === 'EN') return article;

  const overrides = ARTICLE_TRANSLATIONS[normalizedLang]?.[article.id];
  if (overrides) {
    return {
      ...article,
      ...overrides,
      // Retain original image, author, date, and time unless explicitly overridden
      imageUrl: overrides.imageUrl || article.imageUrl,
      author: overrides.author || article.author,
      date: overrides.date || article.date,
      time: overrides.time || article.time,
    };
  }

  // Fallback for dynamically fetched / user-submitted backend articles
  const translatedCategory = getCategoryTranslation(article.category, normalizedLang);
  return {
    ...article,
    category: translatedCategory,
  };
}

/**
 * Translates news category labels ('Local News', 'Technology', etc.)
 */
export function getCategoryTranslation(category, langCode = 'EN') {
  if (!category) return category;
  const normalizedLang = (langCode || 'EN').toUpperCase();
  if (normalizedLang === 'EN') return category;

  const keyMap = {
    'All': 'allCategories',
    'Local News': 'catLocalNews',
    'Technology': 'catTechnology',
    'Transit': 'catTransit',
    'Environment': 'catEnvironment',
    'Education': 'catEducation',
    'Politics': 'catPolitics',
    'Investigation': 'catInvestigation',
    'General News': 'catLocalNews',
  };

  const key = keyMap[category];
  if (key) {
    return t(key, normalizedLang);
  }
  return category;
}

/**
 * Translates post status filter tabs
 */
export function getStatusTabTranslation(tab, langCode = 'EN') {
  if (!tab) return tab;
  const normalizedLang = (langCode || 'EN').toUpperCase();
  if (normalizedLang === 'EN') return tab;

  const keyMap = {
    'My Posts': 'filterAll',
    'Drafts': 'filterDrafts',
    'Submitted': 'filterSubmitted',
    'Under Review': 'filterUnderReview',
    'Published': 'filterPublished',
    'Rejected': 'filterRejected',
  };

  const key = keyMap[tab];
  if (key) {
    return t(key, normalizedLang);
  }
  return tab;
}
