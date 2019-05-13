<?php
ini_set('display_errors', 'Off');

$rgb = array(
	'red' => array(
		255,255,239,255,255,189,206,156,82,255,
		255,222,255,255,206,189,189,140,222,255,
		222,255,255,189,222,189,99,255,255,255,
		255,255,222,189,156,140,255,239,206,189,
		206,156,140,82,49,255,255,222,255,255,
		140,189,140,82,222,206,115,173,156,115,
		82,49,33,255,255,222,255,255,206,156,
		140,82,222,189,99,156,99,82,66,33,
		33,189,140,49,49,0,49,0,16,0,
		156,99,33,66,0,82,33,16,0,222,
		206,140,173,140,173,99,82,49,189,115,
		49,99,16,66,33,0,0,173,82,0,
		82,0,66,0,0,0,206,173,49,82,
		0,115,0,0,0,173,115,99,0,33,
		82,0,0,33,255,239,222,206,189,173,
		156,140,115,99,82,66,49,33,0
	),
	'green' => array(
		239,154,85,101,0,69,0,0,32,186,
		117,48,85,0,101,69,0,32,207,207,
		101,170,101,138,69,69,48,239,223,207,
		186,170,138,101,85,69,207,138,101,138,
		0,101,0,0,0,186,154,32,85,0,
		85,0,0,0,186,170,69,117,48,48,
		32,16,16,255,255,223,255,223,170,154,
		117,85,186,154,48,85,0,69,0,0,
		16,186,154,48,85,0,48,0,16,0,
		239,207,101,170,138,117,85,48,32,255,
		255,170,223,255,186,186,154,101,223,207,
		85,154,117,117,69,32,16,255,255,138
		,186,207,154,101,69,32,255,239,207,239,
		255,170,170,138,69,255,255,223,255,223,
		186,186,138,69,255,239,223,207,186,170,
		154,138,117,101,85,69,48,32,0
	),
	'blue' => array(
		255,173,156,173,99,115,82,49,49,206,
		115,16,66,0,99,66,0,33,189,99,
		33,33,0,82,0,0,16,222,206,173,
		140,140,99,66,49,33,255,255,222,206,
		255,156,173,115,66,255,255,189,239,206,
		115,156,99,66,156,115,49,66,0,33,
		0,0,0,206,115,33,0,0,0,0,
		0,0,255,239,206,255,255,140,156,99,
		49,255,255,173,239,255,140,173,99,33,
		189,115,16,49,49,82,0,33,16,189,
		140,82,140,0,156,0,0,0,255,255,
		156,255,255,173,115,115,66,255,255,189,
		206,255,173,140,82,49,239,222,173,189,
		206,173,156,115,49,173,115,66,0,33,
		82,0,0,33,255,239,222,206,189,173,
		156,140,115,99,82,66,49,33,0,
	)
);

$rgb_id = array(
	'ffefff' => 1, 'ff9aad' => 2, 'ef559c' => 3, 'ff65ad' => 4, 'ff0063' => 5,
	'bd4573' => 6, 'ce0052' => 7, '9c0031' => 8, '522031' => 9, 'ffbace' => 10,
	'ff7573' => 11, 'de3010' => 12, 'ff5542' => 13, 'ff0000' => 14, 'ce6563' => 15,
	'bd4542' => 16, 'bd0000' => 17, '8c2021' => 18, 'decfbd' => 19, 'ffcf63' => 20,
	'de6521' => 21, 'ffaa21' => 22, 'ff6500' => 23, 'bd8a52' => 24, 'de4500' => 25,
	'bd4500' => 26, '633010' => 27, 'ffefde' => 28, 'ffdfce' => 29, 'ffcfad' => 30,
	'ffba8c' => 31, 'ffaa8c' => 32, 'de8a63' => 33, 'bd6542' => 34, '9c5531' => 35,
	'8c4521' => 36, 'ffcfff' => 37, 'ef8aff' => 38, 'ce65de' => 39, 'bd8ace' => 40,
	'ce00ff' => 41, '9c659c' => 42, '8c00ad' => 43, '520073' => 44, '310042' => 45,
	'ffbaff' => 46, 'ff9aff' => 47, 'de20bd' => 48, 'ff55ef' => 49, 'ff00ce' => 50,
	'8c5573' => 51, 'bd009c' => 52, '8c0063' => 53, '520042' => 54, 'deba9c' => 55,
	'ceaa73' => 56, '734531' => 57, 'ad7542' => 58, '9c3000' => 59, '733021' => 60,
	'522000' => 61, '311000' => 62, '211000' => 63, 'ffffce' => 64, 'ffff73' => 65,
	'dedf21' => 66, 'ffff00' => 67, 'ffdf00' => 68, 'ceaa00' => 69, '9c9a00' => 70,
	'8c7500' => 71, '525500' => 72, 'debaff' => 73, 'bd9aef' => 74, '6330ce' => 75,
	'9c55ff' => 76, '6300ff' => 77, '52458c' => 78, '42009c' => 79, '210063' => 80,
	'211031' => 81, 'bdbaff' => 82, '8c9aff' => 83, '3130ad' => 84, '3155ef' => 85,
	'0000ff' => 86, '31308c' => 87, '0000ad' => 88, '101063' => 89, '000021' => 90,
	'9cefbd' => 91, '63cf73' => 92, '216510' => 93, '42aa31' => 94, '008a31' => 95,
	'527552' => 96, '215500' => 97, '103021' => 98, '002010' => 99, 'deffbd' => 100,
	'ceff8c' => 101, '8caa52' => 102, 'addf8c' => 103, '8cff00' => 104, 'adba9c' => 105,
	'63ba00' => 106, '529a00' => 107, '316500' => 108, 'bddfff' => 109, '73cfff' => 110,
	'31559c' => 111, '639aff' => 112, '1075ff' => 113, '4275ad' => 114, '214573' => 115,
	'002073' => 116, '001042' => 117, 'adffff' => 118, '52ffff' => 119, '008abd' => 120,
	'52bace' => 121, '00cfff' => 122, '429aad' => 123, '00658c' => 124, '004552' => 125,
	'002031' => 126, 'ceffef' => 127, 'adefde' => 128, '31cfad' => 129, '52efbd' => 130,
	'00ffce' => 131, '73aaad' => 132, '00aa9c' => 133, '008a73' => 134, '004531' => 135,
	'adffad' => 136, '73ff73' => 137, '63df42' => 138, '00ff00' => 139, '21df21' => 140,
	'52ba52' => 141, '00ba00' => 142, '008a00' => 143, '214521' => 144, 'ffffff' => 145,
	'efefef' => 146, 'dedfde' => 147, 'cecfce' => 148, 'bdbabd' => 149, 'adaaad' => 150,
	'9c9a9c' => 151, '8c8a8c' => 152, '737573' => 153, '636563' => 154, '525552' => 155,
	'424542' => 156, '313031' => 157, '212021' => 158, '000000' => 159
);

$ColorPaletteBackGroundColor = array(
	'ff0063', 'ff0000', 'ff6500', 'ffaa8c', 'ce00ff',
	'ff00ce', '9c3000', 'ffdf00', '6300ff', '0000ff',
	'008a31', '8cff00', '1075ff', '00cfff', '00ffce',
	'21df21', '8c8a8c'
);

$ColorPaletteIndex = array(
	array(
		'red' => array(
				$rgb['red'][32-1],$rgb['red'][23-1],$rgb['red'][14-1],$rgb['red'][68-1],$rgb['red'][104-1],
				$rgb['red'][95-1],$rgb['red'][122-1],$rgb['red'][113-1],$rgb['red'][86-1],$rgb['red'][38-1],
				$rgb['red'][41-1],$rgb['red'][59-1],$rgb['red'][145-1],$rgb['red'][152-1],$rgb['red'][159-1]
			),
		'green' => array(
				$rgb['green'][32-1],$rgb['green'][23-1],$rgb['green'][14-1],$rgb['green'][68-1],$rgb['green'][104-1],
				$rgb['green'][95-1],$rgb['green'][122-1],$rgb['green'][113-1],$rgb['green'][86-1],$rgb['green'][38-1],
				$rgb['green'][41-1],$rgb['green'][59-1],$rgb['green'][145-1],$rgb['green'][152-1],$rgb['green'][159-1]
			),
		'blue' => array(
				$rgb['blue'][32-1],$rgb['blue'][23-1],$rgb['blue'][14-1],$rgb['blue'][68-1],$rgb['blue'][104-1],
				$rgb['blue'][95-1],$rgb['blue'][122-1],$rgb['blue'][113-1],$rgb['blue'][86-1],$rgb['blue'][38-1],
				$rgb['blue'][41-1],$rgb['blue'][59-1],$rgb['blue'][145-1],$rgb['blue'][152-1],$rgb['blue'][159-1]
			)
	),

	array(
		'red' => array(
				$rgb['red'][33-1],$rgb['red'][25-1],$rgb['red'][18-1],$rgb['red'][70-1],$rgb['red'][94-1],
				$rgb['red'][97-1],$rgb['red'][120-1],$rgb['red'][111-1],$rgb['red'][89-1],$rgb['red'][51-1],
				$rgb['red'][53-1],$rgb['red'][62-1],$rgb['red'][149-1],$rgb['red'][154-1],$rgb['red'][159-1]
			),
		'green' => array(
				$rgb['green'][33-1],$rgb['green'][25-1],$rgb['green'][18-1],$rgb['green'][70-1],$rgb['green'][94-1],
				$rgb['green'][97-1],$rgb['green'][120-1],$rgb['green'][111-1],$rgb['green'][89-1],$rgb['green'][51-1],
				$rgb['green'][53-1],$rgb['green'][62-1],$rgb['green'][149-1],$rgb['green'][154-1],$rgb['green'][159-1]
			),
		'blue' => array(
				$rgb['blue'][33-1],$rgb['blue'][25-1],$rgb['blue'][18-1],$rgb['blue'][70-1],$rgb['blue'][94-1],
				$rgb['blue'][97-1],$rgb['blue'][120-1],$rgb['blue'][111-1],$rgb['blue'][89-1],$rgb['blue'][51-1],
				$rgb['blue'][53-1],$rgb['blue'][62-1],$rgb['blue'][149-1],$rgb['blue'][154-1],$rgb['blue'][159-1]
			)
	),

	array(
		'red' => array(
				$rgb['red'][64-1],$rgb['red'][68-1],$rgb['red'][22-1],$rgb['red'][91-1],$rgb['red'][92-1],
				$rgb['red'][94-1],$rgb['red'][109-1],$rgb['red'][110-1],$rgb['red'][112-1],$rgb['red'][10-1],
				$rgb['red'][11-1],$rgb['red'][13-1],$rgb['red'][145-1],$rgb['red'][56-1],$rgb['red'][57-1]
			),
		'green' => array(
				$rgb['green'][64-1],$rgb['green'][68-1],$rgb['green'][22-1],$rgb['green'][91-1],$rgb['green'][92-1],
				$rgb['green'][94-1],$rgb['green'][109-1],$rgb['green'][110-1],$rgb['green'][112-1],$rgb['green'][10-1],
				$rgb['green'][11-1],$rgb['green'][13-1],$rgb['green'][145-1],$rgb['green'][56-1],$rgb['green'][57-1]
			),
		'blue' => array(
				$rgb['blue'][64-1],$rgb['blue'][68-1],$rgb['blue'][22-1],$rgb['blue'][91-1],$rgb['blue'][92-1],
				$rgb['blue'][94-1],$rgb['blue'][109-1],$rgb['blue'][110-1],$rgb['blue'][112-1],$rgb['blue'][10-1],
				$rgb['blue'][11-1],$rgb['blue'][13-1],$rgb['blue'][145-1],$rgb['blue'][56-1],$rgb['blue'][57-1]
			)
	),

	array(
		'red' => array(
				$rgb['red'][118-1],$rgb['red'][122-1],$rgb['red'][112-1],$rgb['red'][110-1],$rgb['red'][120-1],
				$rgb['red'][85-1],$rgb['red'][102-1],$rgb['red'][107-1],$rgb['red'][135-1],$rgb['red'][95-1],
				$rgb['red'][97-1],$rgb['red'][99-1],$rgb['red'][145-1],$rgb['red'][58-1],$rgb['red'][61-1]
			),
		'green' => array(
				$rgb['green'][118-1],$rgb['green'][122-1],$rgb['green'][112-1],$rgb['green'][110-1],$rgb['green'][120-1],
				$rgb['green'][85-1],$rgb['green'][102-1],$rgb['green'][107-1],$rgb['green'][135-1],$rgb['green'][95-1],
				$rgb['green'][97-1],$rgb['green'][99-1],$rgb['green'][145-1],$rgb['green'][58-1],$rgb['green'][61-1]
			),
		'blue' => array(
				$rgb['blue'][118-1],$rgb['blue'][122-1],$rgb['blue'][112-1],$rgb['blue'][110-1],$rgb['blue'][120-1],
				$rgb['blue'][85-1],$rgb['blue'][102-1],$rgb['blue'][107-1],$rgb['blue'][135-1],$rgb['blue'][95-1],
				$rgb['blue'][97-1],$rgb['blue'][99-1],$rgb['blue'][145-1],$rgb['blue'][58-1],$rgb['blue'][61-1]
			)
	),

	array(
		'red' => array(
				$rgb['red'][65-1],$rgb['red'][68-1],$rgb['red'][69-1],$rgb['red'][11-1],$rgb['red'][14-1],
				$rgb['red'][17-1],$rgb['red'][106-1],$rgb['red'][95-1],$rgb['red'][97-1],$rgb['red'][30-1],
				$rgb['red'][32-1],$rgb['red'][34-1],$rgb['red'][145-1],$rgb['red'][122-1],$rgb['red'][159-1]
			),
		'green' => array(
				$rgb['green'][65-1],$rgb['green'][68-1],$rgb['green'][69-1],$rgb['green'][11-1],$rgb['green'][14-1],
				$rgb['green'][17-1],$rgb['green'][106-1],$rgb['green'][95-1],$rgb['green'][97-1],$rgb['green'][30-1],
				$rgb['green'][32-1],$rgb['green'][34-1],$rgb['green'][145-1],$rgb['green'][122-1],$rgb['green'][159-1]
			),
		'blue' => array(
				$rgb['blue'][65-1],$rgb['blue'][68-1],$rgb['blue'][69-1],$rgb['blue'][11-1],$rgb['blue'][14-1],
				$rgb['blue'][17-1],$rgb['blue'][106-1],$rgb['blue'][95-1],$rgb['blue'][97-1],$rgb['blue'][30-1],
				$rgb['blue'][32-1],$rgb['blue'][34-1],$rgb['blue'][145-1],$rgb['blue'][122-1],$rgb['blue'][159-1]
			)
	),

	array(
		'red' => array(
				$rgb['red'][14-1],$rgb['red'][17-1],$rgb['red'][8-1],$rgb['red'][12-1],$rgb['red'][18-1],
				$rgb['red'][9-1],$rgb['red'][65-1],$rgb['red'][68-1],$rgb['red'][71-1],$rgb['red'][66-1],
				$rgb['red'][69-1],$rgb['red'][72-1],$rgb['red'][145-1],$rgb['red'][152-1],$rgb['red'][159-1]
			),
		'green' => array(
				$rgb['green'][14-1],$rgb['green'][17-1],$rgb['green'][8-1],$rgb['green'][12-1],$rgb['green'][18-1],
				$rgb['green'][9-1],$rgb['green'][65-1],$rgb['green'][68-1],$rgb['green'][71-1],$rgb['green'][66-1],
				$rgb['green'][69-1],$rgb['green'][72-1],$rgb['green'][145-1],$rgb['green'][152-1],$rgb['green'][159-1]
			),
		'blue' => array(
				$rgb['blue'][14-1],$rgb['blue'][17-1],$rgb['blue'][8-1],$rgb['blue'][12-1],$rgb['blue'][18-1],
				$rgb['blue'][9-1],$rgb['blue'][65-1],$rgb['blue'][68-1],$rgb['blue'][71-1],$rgb['blue'][66-1],
				$rgb['blue'][69-1],$rgb['blue'][72-1],$rgb['blue'][145-1],$rgb['blue'][152-1],$rgb['blue'][159-1]
			)
	),

	array(
		'red' => array(
				$rgb['red'][127-1],$rgb['red'][130-1],$rgb['red'][133-1],$rgb['red'][119-1],$rgb['red'][122-1],
				$rgb['red'][86-1],$rgb['red'][83-1],$rgb['red'][114-1],$rgb['red'][87-1],$rgb['red'][41-1],
				$rgb['red'][77-1],$rgb['red'][117-1],$rgb['red'][145-1],$rgb['red'][149-1],$rgb['red'][159-1]
			),
		'green' => array(
				$rgb['green'][127-1],$rgb['green'][130-1],$rgb['green'][133-1],$rgb['green'][119-1],$rgb['green'][122-1],
				$rgb['green'][86-1],$rgb['green'][83-1],$rgb['green'][114-1],$rgb['green'][87-1],$rgb['green'][41-1],
				$rgb['green'][77-1],$rgb['green'][117-1],$rgb['green'][145-1],$rgb['green'][149-1],$rgb['green'][159-1]
			),
		'blue' => array(
				$rgb['blue'][127-1],$rgb['blue'][130-1],$rgb['blue'][133-1],$rgb['blue'][119-1],$rgb['blue'][122-1],
				$rgb['blue'][86-1],$rgb['blue'][83-1],$rgb['blue'][114-1],$rgb['blue'][87-1],$rgb['blue'][41-1],
				$rgb['blue'][77-1],$rgb['blue'][117-1],$rgb['blue'][145-1],$rgb['blue'][149-1],$rgb['blue'][159-1]
			)
	),

	array(
		'red' => array(
				$rgb['red'][28-1],$rgb['red'][22-1],$rgb['red'][23-1],$rgb['red'][10-1],$rgb['red'][4-1],
				$rgb['red'][14-1],$rgb['red'][3-1],$rgb['red'][12-1],$rgb['red'][17-1],$rgb['red'][7-1],
				$rgb['red'][8-1],$rgb['red'][9-1],$rgb['red'][145-1],$rgb['red'][149-1],$rgb['red'][159-1]
			),
		'green' => array(
				$rgb['green'][28-1],$rgb['green'][22-1],$rgb['green'][23-1],$rgb['green'][10-1],$rgb['green'][4-1],
				$rgb['green'][14-1],$rgb['green'][3-1],$rgb['green'][12-1],$rgb['green'][17-1],$rgb['green'][7-1],
				$rgb['green'][8-1],$rgb['green'][9-1],$rgb['green'][145-1],$rgb['green'][149-1],$rgb['green'][159-1]
			),
		'blue' => array(
				$rgb['blue'][28-1],$rgb['blue'][22-1],$rgb['blue'][23-1],$rgb['blue'][10-1],$rgb['blue'][4-1],
				$rgb['blue'][14-1],$rgb['blue'][3-1],$rgb['blue'][12-1],$rgb['blue'][17-1],$rgb['blue'][7-1],
				$rgb['blue'][8-1],$rgb['blue'][9-1],$rgb['blue'][145-1],$rgb['blue'][149-1],$rgb['blue'][159-1]
			)
	),

	array(
		'red' => array(
				$rgb['red'][91-1],$rgb['red'][92-1],$rgb['red'][96-1],$rgb['red'][110-1],$rgb['red'][123-1],
				$rgb['red'][87-1],$rgb['red'][39-1],$rgb['red'][51-1],$rgb['red'][54-1],$rgb['red'][34-1],
				$rgb['red'][60-1],$rgb['red'][62-1],$rgb['red'][145-1],$rgb['red'][152-1],$rgb['red'][159-1]
			),
		'green' => array(
				$rgb['green'][91-1],$rgb['green'][92-1],$rgb['green'][96-1],$rgb['green'][110-1],$rgb['green'][123-1],
				$rgb['green'][87-1],$rgb['green'][39-1],$rgb['green'][51-1],$rgb['green'][54-1],$rgb['green'][34-1],
				$rgb['green'][60-1],$rgb['green'][62-1],$rgb['green'][145-1],$rgb['green'][152-1],$rgb['green'][159-1]
			),
		'blue' => array(
				$rgb['blue'][91-1],$rgb['blue'][92-1],$rgb['blue'][96-1],$rgb['blue'][110-1],$rgb['blue'][123-1],
				$rgb['blue'][87-1],$rgb['blue'][39-1],$rgb['blue'][51-1],$rgb['blue'][54-1],$rgb['blue'][34-1],
				$rgb['blue'][60-1],$rgb['blue'][62-1],$rgb['blue'][145-1],$rgb['blue'][152-1],$rgb['blue'][159-1]
			)
	),

	array(
		'red' => array(
				$rgb['red'][10-1],$rgb['red'][11-1],$rgb['red'][13-1],$rgb['red'][28-1],$rgb['red'][29-1],
				$rgb['red'][30-1],$rgb['red'][31-1],$rgb['red'][32-1],$rgb['red'][33-1],$rgb['red'][34-1],
				$rgb['red'][35-1],$rgb['red'][36-1],$rgb['red'][27-1],$rgb['red'][62-1],$rgb['red'][159-1]
			),
		'green' => array(
				$rgb['green'][10-1],$rgb['green'][11-1],$rgb['green'][13-1],$rgb['green'][28-1],$rgb['green'][29-1],
				$rgb['green'][30-1],$rgb['green'][31-1],$rgb['green'][32-1],$rgb['green'][33-1],$rgb['green'][34-1],
				$rgb['green'][35-1],$rgb['green'][36-1],$rgb['green'][27-1],$rgb['green'][62-1],$rgb['green'][159-1]
			),
		'blue' => array(
				$rgb['blue'][10-1],$rgb['blue'][11-1],$rgb['blue'][13-1],$rgb['blue'][28-1],$rgb['blue'][29-1],
				$rgb['blue'][30-1],$rgb['blue'][31-1],$rgb['blue'][32-1],$rgb['blue'][33-1],$rgb['blue'][34-1],
				$rgb['blue'][35-1],$rgb['blue'][36-1],$rgb['blue'][27-1],$rgb['blue'][62-1],$rgb['blue'][159-1]
			)
	),

	array(
		'red' => array(
				$rgb['red'][145-1],$rgb['red'][146-1],$rgb['red'][19-1],$rgb['red'][55-1],$rgb['red'][56-1],
				$rgb['red'][24-1],$rgb['red'][58-1],$rgb['red'][35-1],$rgb['red'][36-1],$rgb['red'][60-1],
				$rgb['red'][27-1],$rgb['red'][61-1],$rgb['red'][62-1],$rgb['red'][63-1],$rgb['red'][159-1]
			),
		'green' => array(
				$rgb['green'][145-1],$rgb['green'][146-1],$rgb['green'][19-1],$rgb['green'][55-1],$rgb['green'][56-1],
				$rgb['green'][24-1],$rgb['green'][58-1],$rgb['green'][35-1],$rgb['green'][36-1],$rgb['green'][60-1],
				$rgb['green'][27-1],$rgb['green'][61-1],$rgb['green'][62-1],$rgb['green'][63-1],$rgb['green'][159-1]
			),
		'blue' => array(
				$rgb['blue'][145-1],$rgb['blue'][146-1],$rgb['blue'][19-1],$rgb['blue'][55-1],$rgb['blue'][56-1],
				$rgb['blue'][24-1],$rgb['blue'][58-1],$rgb['blue'][35-1],$rgb['blue'][36-1],$rgb['blue'][60-1],
				$rgb['blue'][27-1],$rgb['blue'][61-1],$rgb['blue'][62-1],$rgb['blue'][63-1],$rgb['blue'][159-1]
			)
	),

	array(
		'red' => array(
				$rgb['red'][145-1],$rgb['red'][146-1],$rgb['red'][147-1],$rgb['red'][148-1],$rgb['red'][149-1],
				$rgb['red'][150-1],$rgb['red'][151-1],$rgb['red'][152-1],$rgb['red'][153-1],$rgb['red'][154-1],
				$rgb['red'][155-1],$rgb['red'][156-1],$rgb['red'][157-1],$rgb['red'][158-1],$rgb['red'][159-1]
			),
		'green' => array(
				$rgb['green'][145-1],$rgb['green'][146-1],$rgb['green'][147-1],$rgb['green'][148-1],$rgb['green'][149-1],
				$rgb['green'][150-1],$rgb['green'][151-1],$rgb['green'][152-1],$rgb['green'][153-1],$rgb['green'][154-1],
				$rgb['green'][155-1],$rgb['green'][156-1],$rgb['green'][157-1],$rgb['green'][158-1],$rgb['green'][159-1]
			),
		'blue' => array(
				$rgb['blue'][145-1],$rgb['blue'][146-1],$rgb['blue'][147-1],$rgb['blue'][148-1],$rgb['blue'][149-1],
				$rgb['blue'][150-1],$rgb['blue'][151-1],$rgb['blue'][152-1],$rgb['blue'][153-1],$rgb['blue'][154-1],
				$rgb['blue'][155-1],$rgb['blue'][156-1],$rgb['blue'][157-1],$rgb['blue'][158-1],$rgb['blue'][159-1]
			)
		)
);
