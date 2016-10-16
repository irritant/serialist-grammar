/*
Serialist-Grammar provides a concise syntax for the expression and transformation of pitch class, octave, dynamics and duration rows in serial music composition.
Copyright (C) 2016  Irritant Creative Inc.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/* **************** */
/* Global Functions */
/* **************** */

{
    // Voice:

    function flatten_voice(voice) {
        if (voice.length === 0) {
            return null;
        }

        var flat = {
            id: '',
            pc: [],
            oct: [],
            dyn: [],
            dur: []
        };

        voice.forEach(function(element) {
            var type = element[0];
            var val = element[1];

            if (Array.isArray(val)) {
                flat[type] = flat[type].concat(val);
            } else {
                flat[type] = val;
            }
        });

        return flat;
    }

    // Pitch class rows:

    function apply_pitch_class_row_transforms(row, transforms) {
        transforms.forEach(function(t) {
            var transform_name = t[0];
            var transform_args = t[1];

            // Evaluate forms:
            if (transform_name == 'forms') {
                row = apply_row_forms(row, transform_args, function(f) {
                    // Round the result:
                    return Math.round(12 - f)  % 12;
                });
            }

            // Evaluate math:
            if (transform_name == 'math') {
                row = apply_row_math(row, transform_args, function(f) {
                    // Round the result:
                    return Math.round(f)  % 12;
                });
            }

            // Evaluate rotations:
            if (transform_name == 'rotation') {
                row = apply_row_rotation(row, transform_args);
            }

            // Evaluate slices:
            if (transform_name == 'slice') {
                row = apply_row_slice(row, transform_args);
            }

        });

        return row;
    }

    // Octave rows:

    function apply_octave_row_transforms(row, transforms) {
        transforms.forEach(function(t) {
            var transform_name = t[0];
            var transform_args = t[1];

            // Evaluate forms:
            if (transform_name == 'forms') {
                row = apply_row_forms(row, transform_args, function(f) {
                    // Round the result:
                    return Math.round(-f);
                });
            }

            // Evaluate math:
            if (transform_name == 'math') {
                row = apply_row_math(row, transform_args, function(f) {
                    // Round the result:
                    return Math.round(f);
                });
            }

            // Evaluate rotations:
            if (transform_name == 'rotation') {
                row = apply_row_rotation(row, transform_args);
            }

            // Evaluate slices:
            if (transform_name == 'slice') {
                row = apply_row_slice(row, transform_args);
            }

        });

        return row;
    }

    // Dynamics rows:

    function apply_dynamics_row_transforms(row, transforms) {
        transforms.forEach(function(t) {
            var transform_name = t[0];
            var transform_args = t[1];

            // Evaluate forms:
            if (transform_name == 'forms') {
                row = apply_row_forms(row, transform_args, function(f) {
                    // Limit the result:
                    return Math.min(1.0, Math.max(1.0 - f, 0.0));
                });
            }

            // Evaluate math:
            if (transform_name == 'math') {
                row = apply_row_math(row, transform_args, function(f) {
                    // Limit the result:
                    return Math.min(1.0, Math.max(f, 0.0));
                });
            }

            // Evaluate rotations:
            if (transform_name == 'rotation') {
                row = apply_row_rotation(row, transform_args);
            }

            // Evaluate slices:
            if (transform_name == 'slice') {
                row = apply_row_slice(row, transform_args);
            }

        });

        return row;
    }

    // Duration rows:

    function apply_duration_row_transforms(row, transforms) {
        transforms.forEach(function(t) {
            var transform_name = t[0];
            var transform_args = t[1];

            // Evaluate forms:
            if (transform_name == 'forms') {
                row = apply_row_forms(row, transform_args, function(f) {
                    // Limit the result:
                    return Math.max(1.0 / f, 0);
                });
            }

            // Evaluate math:
            if (transform_name == 'math') {
                row = apply_row_math(row, transform_args, function(f) {
                    // Limit the result:
                    return Math.max(f, 0);
                })
                .filter(function(f) {
                    // Filter zero and negative values:
                    return f > 0;
                });
            }

            // Evaluate rotations:
            if (transform_name == 'rotation') {
                row = apply_row_rotation(row, transform_args);
            }

            // Evaluate slices:
            if (transform_name == 'slice') {
                row = apply_row_slice(row, transform_args);
            }

        });

        return row;
    }

    // Row forms:

    function apply_row_forms(row, args, inversion_transform) {
        args.forEach(function(form) {
            switch(form) {
                case 'r':
                    row = row.reverse();
                    break;
                case 'i':
                    row = row.map(function(f) {
                        if (typeof inversion_transform == 'function') {
                            return inversion_transform(f);
                        } else {
                            return f;
                        }
                    });
                    break;
                default:
                    break;
            }
        });

        return row;
    }

    // Row math:

    function apply_row_math(row, args, value_transform) {
        var op = args[0];
        var val = args[1];

        row = row.map(function(f) {
            switch (op) {
                case '+':
                    f += val;
                    break;
                case '-':
                    f -= val;
                    break;
                case '*':
                    f *= val;
                    break;
                case '/':
                    f /= (val !== 0) ? val : 1;
                    break;
                case '%':
                    f %= val;
                    break;
                default:
                    break;
            }

            if (typeof value_transform == 'function') {
                return value_transform(f);
            } else {
                return f;
            }
        });

        return row;
    }

    // Row rotation:

    function apply_row_rotation(row, args) {
        var op = args[0];
        var val = args[1] % row.length;

        switch (op) {
            case '<<':
                var head = row.slice(0, row.length - val);
                var tail = row.slice(row.length - val, row.length);
                row = tail.concat(head);
                break;
            case '>>':
                var head = row.slice(0, val);
                var tail = row.slice(val, row.length);
                row = tail.concat(head);
                break;
            default:
                break;
        }

        return row;
    }

    // Row slice:

    function apply_row_slice(row, args) {
        var start = args[0];
        var end = args[1];
        return row.slice(start, end);
    }
}

/* ******* */
/* Grammar */
/* ******* */

start = (
    flags: flag*
    voices:voice_sequence
    {
        flags.forEach(function(flag) {
            switch (flag) {
                case 'flat':
                    voices = voices.map(function(voice) {
                        return flatten_voice(voice);
                    });
                    break;
                default:
                    break;
            }
        });

        return voices;
    }
)

flag = (
    flag: 'flat' space_or_line_break
    {
        return flag;
    }
)

voice_sequence = (
    head: (voice:voice voice_separator { return voice; })*
    tail: ((voice:voice { return voice; }) / voice_separator)
    {
        return head.concat([tail]);
    }
)

voice = (
    voice_id_label /
    pitch_class_row_label /
    octave_row_label /
    dynamics_row_label /
    duration_row_label
)*

// Voice identifier:

voice_id_label = (
    label: 'id' space_or_line_break
    value: voice_id_value space_or_line_break
    {
        return [label, value];
    }
)

voice_id_value = (
    '(' space_or_line_break value: $[a-zA-Z0-9]+ space_or_line_break ')'
    {
        return value;
    }
)

// Pitch class row:

pitch_class_row_label = (
    label: 'pc' space_or_line_break
    row: (pitch_class_row_transformed space_or_line_break)?
    {
        return [label, row[0]];
    }
)

pitch_class_row_transformed = (
    row: pitch_class_row space*
    transforms: (t:row_transform space* { return t; })*
    {
        if (transforms) {
            row = apply_pitch_class_row_transforms(row, transforms);
        }

        return row;
    }
)

pitch_class_row = (
    '(' space*
    head: (pc:pitch_class space+ { return pc; })*
    tail: ((pc:pitch_class { return pc; }) / space*)
    ')'
    {
        return head.concat(tail);
    }
)

// Octave row:

octave_row_label = (
    label: 'oct' space_or_line_break
    row: (octave_row_transform space_or_line_break)?
    {
        return [label, row[0]];
    }
)

octave_row_transform = (
    row: octave_row space*
    transforms: (t:row_transform space* { return t; })*
    {
        if (transforms) {
            row = apply_octave_row_transforms(row, transforms);
        }

        return row;
    }
)

octave_row = (
    '(' space*
    head: (i:signed_int space+ { return i; })*
    tail: ((i:signed_int { return i; }) / space*)
    ')'
    {
        return head.concat(tail);
    }
)

// Dynamics row:

dynamics_row_label = (
    label: 'dyn' space_or_line_break
    row: (dynamics_row_transform space_or_line_break)?
    {
        return [label, row[0]];
    }
)

dynamics_row_transform = (
    row: dynamics_row space*
    transforms: (t:row_transform space* { return t; })*
    {
        if (transforms) {
            row = apply_dynamics_row_transforms(row, transforms);
        }

        return row;
    }
)

dynamics_row = (
    '(' space*
    head: (f:float space+ { return f; })*
    tail: ((f:float { return f; }) / space*)
    ')'
    {
        return head.concat(tail).map(function(f) {
            // Limit to range 0-1:
            return Math.min(1.0, Math.max(f, 0.0));
        });
    }
)

// Duration row:

duration_row_label = (
    label: 'dur' space_or_line_break
    row: (duration_row_transform space_or_line_break)?
    {
        return [label, row[0]];
    }
)

duration_row_transform = (
    row: duration_row space*
    transforms: (t:row_transform space* { return t; })*
    {
        if (transforms) {
            row = apply_duration_row_transforms(row, transforms);
        }

        return row;
    }
)

duration_row = (
    '(' space*
    head: (f:float space+ { return f; })*
    tail: ((f:float { return f; }) / space*)
    ')'
    {
        return head.concat(tail).filter(function(f) {
            // Filter zero and negative values:
            return f > 0.0;
        });
    }
)

// Row transforms:

row_transform = (
    row_forms /
    row_rotation /
    row_slice /
    row_math
)

row_forms = (
    '@' space*
    form: ('r' / 'i')*
    {
        return ['forms', form];
    }
)

row_rotation = (
    op: ('<<' / '>>') space*
    val: int
    {
        return ['rotation', [op, val]];
    }
)

row_slice = (
    '[' space*
    head: (i:int space+ { return i; })*
    tail: ((i:int { return i; }) / space*)
    ']'
    {
        return ['slice', head.concat(tail)];
    }
)

row_math = (
    space*
    op: ('+' / '-' / '*' / '/' / '%')
    space*
    val: all_types
    {
        return ['math', [op, val]];
    }
)

// Types:

all_types = (
    float /
    int /
    signed_int /
    pitch_class
)

pitch_class = (
    pc: [0-9te]
    {
        switch(pc) {
            case 't':
                return 10;
            case 'e':
                return 11;
            default:
                return +pc % 12;
        }
    }
)

float = f:$([0-9]* dot? [0-9]*) { return isNaN(f) ? 0 : +f }
signed_int = sign:'-'? i:int { return (sign) ? 0 - (+i) : +i; }
int = i:$([0-9]+) { return +i }

// Punctuation, whitespace and breaks:

dot = '.'
space = ' ' / '\t'
line_break = '\n'
space_or_line_break = space* line_break* space*
voice_separator = space_or_line_break ',' space_or_line_break