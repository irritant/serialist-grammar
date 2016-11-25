# Serialist-Grammar

Serialist-Grammar provides a concise syntax for the expression and transformation of rows in serial music composition.

## Installation

Install with npm:

	npm install --save serialist-grammar

## Usage

Serialist-Grammar includes a pre-compiled parser as a CommonJS module:

1. Require the parser and process input according to the syntax defined below

		var SerialistGrammar = require('serialist-grammar');
		var output = SerialistGrammar.parse('flat pc(0 3 1 8 7) @r');

2. Map the parser output to your target application

If you need the parser in a different module format, you can compile it with PEG.js:

1. Install [PEG.js](http://pegjs.org)
2. Use PEG.js to [generate a parser](http://pegjs.org/documentation#generating-a-parser) from `serialist-grammar.pegjs`
3. Use the parser to process input according to the syntax defined below
4. Map the parser output to your target application

## Syntax

### Rows

Serialist-Grammar accepts rows for pitch class, octave, dynamics, duration and arbitrary data. Row types may be placed in any order and used as many times as you want.

#### Pitch Class

Pitch class rows consist of whitespace-delimited pitch classes, surrounded by parenthesis and prefixed with `pc`. Pitch classes are expressed in the traditional notation &mdash; digits `0-9`, `t` for `10` and `e` for `11`.

	pc(0 1 4 t) // parsed as [0, 1, 4, 10]

#### Octave

Octave rows consist of whitespace-delimited signed integer values, surrounded by parenthesis and prefixed with `oct`. `0` should be mapped to an octave around the middle of the pitch range of your target application. Positive and negative values should represent octaves above and below the middle octave, respectively.

	oct(0 1 -2 4) // parsed as [0, 1, -2, 4]

#### Dynamics

Dynamics rows consist of whitespace-delimited float values, surrounded by parenthesis and prefixed with `dyn`. Dynamics values are limited to the range `0-1`.

	dyn(0.5 0.75 1 1.5) // parsed as [0.5, 0.75, 1, 1]

#### Duration

Duration rows consist of whitespace-delimited float values, surrounded by parenthesis and prefixed with `dur`. Duration values should be mapped to a multiple of beat/cycle duration in your target application. (`1` is equal to 1 beat, `0.5` is equal to half a beat, etc.) Values must be positive &mdash; negative values will result in a parse error and `0` values will be filtered.

	dur(1 0.5 0.5 2 0) // parsed as [1, 0.5, 0.5, 2]

#### Data

Data rows consist of whitespace-delimited numeric values, surrounded by parenthesis and prefixed with any alphanumeric string. Data rows are indended to allow application developers to add support for arbitrary features (e.g. MIDI continuous controller messages).

	cc127(32 64 96) // parsed as [32, 64, 96] with the label 'cc127'

### Transformations

Serial-Grammar provides a series of transformations that can be applied to all types of rows. Transformations may be placed in any order and used as many times as you want:

	pc(1 4 0 t 7) @r >> 3 [1 4] @i +3 << 1 *2

The example above does the following:

1. `pc(1 4 0 t 7)`: define a pitch class row
2. `@r`: use the retrograde form of the row
3. `>> 3`: rotate the row forward by 3 positions
4. `[1 4]`: shorten the row by slicing between indexes 1 and 4
5. `@i`: use the inverted form of the shortened row
6. `+3`: add 3 to all pitch classes in the row (transpose +3 semitones)
7. `<< 1`: rotate the row backward by 1 position
8. `+3`: multiply all pitch classes in the row by 2

#### Row Forms

Row forms are expressed as the `@` symbol followed by `r` and/or `i`, which indicate the retrograde and inverted forms of the row:

* `@r`: retrograde
* `@i`: inversion
* `@ri` retrograde followed by inversion (may also be expressed as `@r @i`)
* `@ir` inversion followed by retrograde (may also be expressed as `@i @r`)

The retrograde form is simply the row in reverse order:

	pc(1 2 3) // reverses to pc(3 2 1)

Inversion behaves differently depending on the type of row. Pitch class rows are inverted within the octave, according to the equation `(12 - value) % 12`:

	pc(1 4 0 t 7) @i // inverts to pc(e 8 0 2 5)

Octave rows are inverted around the middle octave by negating the value:

	oct(1 0 -2) @i // inverts to oct(-1 0 2)

Dynamics rows are inverted within the range `0-1`:

	dyn(1 0.5 0.25 0) @i // inverts to dyn(0 0.5 0.75 1)

Duration rows are inverted according to the equation `1 / value`:

	dur(1 0.5 1.5 2) @i // inverts to dur(1 2 0.6666666666666666 0.5)

Data rows are inverted using negation:

	myData(1 0.5 2) @i // inverts to myData(-1 -0.5 -2)

#### Rotation

Row rotation is expressed with the `>>` operator for forward rotation and the `<<` operator for backward rotation, followed by the number of positions to rotate by:

	pc(1 2 3 4 5) >> 1 // rotates to pc(2 3 4 5 1)
	pc(1 2 3 4 5) >> 2 // rotates to pc(3 4 5 1 2)
	pc(1 2 3 4 5) << 1 // rotates to pc(5 1 2 3 4)
	pc(1 2 3 4 5) << 2 // rotates to pc(4 5 1 2 3)

The rotation position will wrap within the length of the row, so values greater than the length of the row will still provide useful results:

	pc(1 2 3 4 5) >> 7 // equivalent to pc(1 2 3 4 5) >> (7 % 5) or pc(1 2 3 4 5) >> 2 and rotates to pc(3 4 5 1 2)

#### Slicing

Slicing a row results in a shortened row that contains the values between the start and end indexes of the slice. A slice is expressed as a start index and optional end index, separated by whitespace and surrounded by square brackets:

	pc(1 2 3 4 5) [1 4] // slices to [2 3 4]

Omit the end index to slice from the start index to the end of the row:

	pc(1 2 3 4 5) [2] // slices to pc(3 4 5)

Slicing uses [Array.prototype.slice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice), so the value at the end index is _not_ included in the slice.

#### Math Expressions

Serialist-Grammar supports addition (`+`), subtraction (`-`), multiplication (`*`), division (`/`) and remainder (`%`) operators. Math expressions are evaluated on each value in the row with the following limitations:

1. In pitch class rows, the result will be wrapped within the normal pitch class range (`0-11`) and rounded to the nearest integer
2. In octave rows, the result will be rounded to the nearest integer
3. In dynamics rows, the result will be always limited to the range `0-1`
4. In duration rows, the result will be limited to a minimum value of `0` and `0` values are filtered
5. Division by `0` expressions will be ignored

Examples:

	pc(1 4 5 8) + 2 // results in pc(3 6 7 t)
	pc(1 4 5 8) - 2 // results in pc(e 2 3 6) after wrapping within 0-11
	pc(1 4 5 8) * 2 // results in pc(2 8 t 4) after wrapping within 0-11
	pc(1 4 5 8) / 2 // results in pc(1 2 3 4) after rounding to the nearest integer
	pc(1 4 5 8) % 2 // results in pc(1 0 1 0)
	dyn(0.5 0.25 0.75 2) - 0.5 // results in dyn(0 0 0.25 1) after limiting to 0-1
	dur(1 0.5 0.5 2) - 1 // results in pc(1) after limiting to a minimum of zero and filtering zero
	dur(1 0.5 0.5) / 0 // results in dur(1 0.5 0.5) because division by zero is ignored

### Identifiers

Each sequence of rows may be given an arbitrary identifier consisting of an alphanumeric string prefixed by `id:`:

	id:sequence1 pc(1 2 5)

### Flags

Flags may be added to the beginning of the input to control parser behaviour.

Currently, the only supported flag is `flat`, which changes the output format. Without the `flat` flag, the output closely matches the input. Notice that the two pitch class rows are represented by separate arrays:

	id(sequence1) pc(1 2 5) pc(7 8 t) oct(0 2) dyn(0.75 0.5 0.25) dur(1 0.5 0.5)

	// Output:
	/*
	[
		[
			[
		    	"id",
	     		"sequence1"
		  	],
		  	[
		    	"pc",
	     		[
	        		1,
	        		2,
	        		5
	     		]
		  	],
		  	[
		    	"pc",
		     	[
		        	7,
		        	8,
		        	10
		     	]
		  	],
		  	[
		    	"oct",
		     	[
		        	0,
		       		2
		     	]
		  	],
		  	[
		    	"dyn",
		    	[
		        	0.75,
		        	0.5,
		        	0.25
		    	]
		  	],
		  	[
		    	"dur",
		    	[
		        	1,
		        	0.5,
		        	0.5
		     	]
		  	]
		]
	]
	*/

The `flat` flag simplifies the output by formatting each voice as an object with one member per row type. Multiple rows of the same type will be concatenated in the order in which they appear in the input:

	flat
	id(sequence1) pc(1 2 5) pc(7 8 t) oct(0 2) dyn(0.75 0.5 0.25) dur(1 0.5 0.5)

	// Output:
	[
		{
		  	"id": "sequence1",
		  	"pc": [
		     	1,
		     	2,
		     	5,
		     	7,
		     	8,
		     	10
		  	],
		  	"oct": [
		     	0,
		     	2
		  	],
		  	"dyn": [
		     	0.75,
		     	0.5,
		     	0.25
		  	],
		  	"dur": [
		     	1,
		     	0.5,
		     	0.5
		  	]
		}
	]

### Multiple Voices

Multiple voices may be defined by separating sequences of rows with a comma and newline. Each voice will appear as a separate object in the output:

	flat
	id(sequence1) pc(1 2 5) dur(1 0.5),
	id(sequence2) pc(3 4 7) dur(0.5 0.25)

	// Output:
	/*
	[
		{
		  	"id": "sequence1",
		  	"pc": [
		    	1,
		     	2,
		     	5
		  ],
		  "oct": [],
		  "dyn": [],
		  "dur": [
		     1,
		     0.5
		  ]
		},
		{
		  "id": "sequence2",
		  "pc": [
		     3,
		     4,
		     7
		  ],
		  "oct": [],
		  "dyn": [],
		  "dur": [
		     0.5,
		     0.25
		  ]
		}
	]
	*/

### Whitespace &amp; Line Breaks

Serialist-Grammar is very accommodating of whitespace (or lack thereof). All of the following inputs should be valid and produce identical output:

	// 1.

	id(sequence1) pc(1 2 5) + 2 pc(7 8 t) << 1 oct(0 2) / 2 dyn(0.75 0.5 0.25) [1] dur(1 0.5 0.5) * 2,
	id(sequence2) pc(t 1 2) << 2 oct(3 5 4 2) * 3 dyn(1 0.5) - 0.25 dur(0.5 0.25 0.25)

	// 2.

	id(sequence1) pc(1 2 5)+2 pc(7 8 t)<<1 oct(0 2)/2 dyn(0.75 0.5 0.25)[1] dur(1 0.5 0.5)*2,
	id(sequence2) pc(t 1 2)<<2 oct(3 5 4 2)*3 dyn(1 0.5)-0.25 dur(0.5 0.25 0.25)

	// 3.

	id(sequence1)
	pc(1 2 5) +2
	pc(7 8 t) <<1
	oct(0 2) /2
	dyn(0.75 0.5 0.25) [1]
	dur(1 0.5 0.5) * 2,

	id(sequence2)
	pc(t 1 2) <<2
	oct(3 5 4 2) *3
	dyn(1 0.5) - 0.25
	dur(0.5 0.25 0.25)

	// 4.

	id(sequence1)
		pc(1 2 5) +2
		pc(7 8 t) <<1
		oct(0 2) /2
		dyn(0.75 0.5 0.25) [1]
		dur(1 0.5 0.5) * 2,

	id(sequence2)
		pc(t 1 2) <<2
		oct(3 5 4 2) *3
		dyn(1 0.5) - 0.25
		dur(0.5 0.25 0.25)

## License

Serialist-Grammar is made available under the terms of the GNU General Public License v3.0 (or greater).
