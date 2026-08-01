#!/usr/bin/env python3
"""
sm_to_chart.py

Converts a StepMania .sm file (dance-single chart) into a chart.js file
compatible with the DDR-inspired 4-key VSRG.

USAGE
-----
    python sm_to_chart.py song.sm

    # If the .sm has multiple difficulty charts, list them first:
    python sm_to_chart.py song.sm --list

    # Then pick one by index (0-based, as shown by --list):
    python sm_to_chart.py song.sm --index 2

    # Custom output path (defaults to chart.js in the current folder):
    python sm_to_chart.py song.sm -o chart.js

NOTES / LIMITATIONS
--------------------
- Only handles "dance-single" charts (4 columns), which is what this
  game supports.
- Hold/roll notes are converted into a single tap at the note's start.
  Their "tail" (end of hold) is ignored, since this game only has taps.
  Mines (M) are skipped entirely.
- Assumes a single constant BPM for the whole song. If the .sm file has
  BPM changes (#BPMS with multiple entries), the script will warn you
  and use the first BPM value; beats after a BPM change will drift out
  of sync in-game. For most simple/short charts this is not an issue,
  but for songs with tempo changes you'll need to hand-adjust the
  affected section's beat numbers afterward (or ask for help extending
  the script to support BPM segments).
- #OFFSET in .sm files is negated relative to this game's `offset`
  value (StepMania's offset = seconds the song is delayed before beat
  0; this game's offset = seconds until beat 0 occurs). The script
  handles this conversion for you.
"""

import argparse
import re
import sys


def parse_sm_tags(text):
    """Extract all #TAG:value; pairs from the .sm file (single-line tags)."""
    tags = {}
    # Matches #TAG:value; possibly spanning multiple lines, non-greedy
    for match in re.finditer(r'#([A-Z]+):(.*?);', text, re.DOTALL):
        key = match.group(1).strip().upper()
        value = match.group(2).strip()
        # Some tags (like NOTES) appear multiple times; keep a list for those
        tags.setdefault(key, []).append(value)
    return tags


def parse_bpms(bpms_str):
    """
    Parse a #BPMS value like '0.000=120.000,32.000=140.000'
    into a list of (beat, bpm) tuples sorted by beat.
    """
    segments = []
    for part in bpms_str.split(','):
        part = part.strip()
        if not part:
            continue
        beat_str, bpm_str = part.split('=')
        segments.append((float(beat_str), float(bpm_str)))
    segments.sort(key=lambda s: s[0])
    return segments


def parse_notes_blocks(raw_notes_list):
    """
    Each raw NOTES block (the text that was between #NOTES: and the
    closing ;) looks like:

        dance-single:
        :
        Challenge:
        12:
        0,0,0,0,0,0,0,0,0,0,0,0:
        measure1 rows
        ,
        measure2 rows
        ...

    The first 5 colon-separated fields are metadata, the rest is the
    note data itself.
    """
    charts = []
    for block in raw_notes_list:
        # split into the 6 leading fields (5 metadata + note data), the
        # metadata fields don't contain commas so splitting on the first
        # 5 colons is safe
        parts = block.split(':', 5)
        if len(parts) < 6:
            continue
        step_type = parts[0].strip()
        description = parts[1].strip()
        difficulty = parts[2].strip()
        meter = parts[3].strip()
        note_data = parts[5]

        charts.append({
            'step_type': step_type,
            'description': description,
            'difficulty': difficulty,
            'meter': meter,
            'note_data': note_data
        })
    return charts


def notes_from_note_data(note_data, columns=4):
    """
    Parse the raw note-data string into a list of {beat, lane} dicts.
    note_data is measures separated by commas; each measure is a series
    of newline-separated rows, each row is `columns` characters long.
    """
    notes = []
    measures = note_data.split(',')

    for measure_index, measure in enumerate(measures):
        rows = [r.strip() for r in measure.splitlines() if r.strip() != '']
        row_count = len(rows)
        if row_count == 0:
            continue

        for row_index, row in enumerate(rows):
            beat = measure_index * 4 + (row_index / row_count) * 4
            for lane, char in enumerate(row[:columns]):
                # 1 = normal tap, 2 = hold head, 4 = roll head
                # (3 = hold/roll tail, M = mine, 0 = nothing -> all skipped)
                if char in ('1', '2', '4'):
                    notes.append({'beat': round(beat, 4), 'lane': lane})

    notes.sort(key=lambda n: (n['beat'], n['lane']))
    return notes


def format_chart_js(title, bpm, offset, notes, warnings):
    lines = []
    lines.append('/* ============================================================')
    lines.append('   AUTO-GENERATED from a StepMania .sm file by sm_to_chart.py')
    lines.append('   Feel free to hand-tweak anything below, this is a normal')
    lines.append('   chart.js file like any other.')
    if warnings:
        lines.append('')
        lines.append('   WARNINGS FROM CONVERSION:')
        for w in warnings:
            lines.append(f'   - {w}')
    lines.append('   ============================================================ */')
    lines.append('')
    lines.append('function n(beat, lane) {')
    lines.append('  return { beat, lane };')
    lines.append('}')
    lines.append('')
    lines.append('const CHART = {')
    lines.append(f'  songTitle: {title!r},')
    lines.append('')
    lines.append(f'  bpm: {bpm},')
    lines.append(f'  offset: {offset},')
    lines.append('')
    lines.append('  approachTime: 1.4,')
    lines.append('')
    lines.append('  birthdayMessage: "Happy birthday, you absolute legend! 🎂",')
    lines.append('')
    lines.append('  notes: [')
    for nt in notes:
        lines.append(f"    n({nt['beat']}, {nt['lane']}),")
    lines.append('  ]')
    lines.append('};')
    lines.append('')
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Convert a StepMania .sm file to chart.js')
    parser.add_argument('sm_file', help='Path to the .sm file')
    parser.add_argument('--list', action='store_true', help='List available charts (difficulties) and exit')
    parser.add_argument('--index', type=int, default=0, help='Index of the dance-single chart to convert (see --list)')
    parser.add_argument('-o', '--output', default='chart.js', help='Output path for the generated chart.js')
    args = parser.parse_args()

    with open(args.sm_file, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()

    tags = parse_sm_tags(text)

    title = tags.get('TITLE', ['Untitled'])[0]
    offset_sm = float(tags.get('OFFSET', ['0'])[0])
    bpms_raw = tags.get('BPMS', ['0.000=120.000'])[0]
    bpm_segments = parse_bpms(bpms_raw)

    warnings = []
    if len(bpm_segments) > 1:
        warnings.append(
            f"This song has {len(bpm_segments)} BPM changes ({bpm_segments}); "
            "only the first BPM was used. Notes after a tempo change may drift "
            "out of sync — nudge them by hand if needed."
        )
    bpm = bpm_segments[0][1]

    # this game's offset = seconds until beat 0 hits.
    # StepMania's #OFFSET = seconds the song is shifted so that beat 0
    # lands at time (-offset). So: game_offset = -sm_offset
    offset = round(-offset_sm, 4)

    raw_notes_list = tags.get('NOTES', [])
    all_charts = parse_notes_blocks(raw_notes_list)
    dance_single_charts = [c for c in all_charts if c['step_type'] == 'dance-single']

    if not dance_single_charts:
        print("No dance-single charts found in this .sm file.", file=sys.stderr)
        sys.exit(1)

    if args.list:
        print(f"Found {len(dance_single_charts)} dance-single chart(s) in '{args.sm_file}':\n")
        for i, c in enumerate(dance_single_charts):
            desc = c['description'] or '(no description)'
            print(f"  [{i}] {c['difficulty']}  (meter {c['meter']}, {desc})")
        return

    if args.index >= len(dance_single_charts):
        print(f"Index {args.index} out of range — only {len(dance_single_charts)} "
              f"dance-single chart(s) found. Run with --list to see options.", file=sys.stderr)
        sys.exit(1)

    chosen = dance_single_charts[args.index]
    notes = notes_from_note_data(chosen['note_data'])

    if not notes:
        warnings.append("No notes were parsed — double check the .sm file's NOTES block looks correct.")

    output = format_chart_js(title, bpm, offset, notes, warnings)
    with open(args.output, 'w', encoding='utf-8') as f:
        f.write(output)

    print(f"Converted '{title}' — {chosen['difficulty']} (meter {chosen['meter']})")
    print(f"BPM: {bpm}, Offset: {offset}")
    print(f"{len(notes)} notes written to {args.output}")
    for w in warnings:
        print(f"WARNING: {w}")


if __name__ == '__main__':
    main()
