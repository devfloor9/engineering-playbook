"""Exercise the DGX example against synthetic PF/VF directories."""

import os
from pathlib import Path
import shlex
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[3]
ARTICLE = 'eks-hybrid-nodes/compute-gpu/gpu-sriov-networking.md'
LOCALES = ('docs', 'i18n/ko/docusaurus-plugin-content-docs/current')
PREFIX = '02:11:22:33:44:55'


class VFSetupTests(unittest.TestCase):
    def test_paired_examples_assign_stable_unique_node_and_port_guids(self):
        for locale in LOCALES:
            with self.subTest(locale=locale), tempfile.TemporaryDirectory() as scratch:
                fabric = Path(scratch)
                text = (ROOT / locale / ARTICLE).read_text()
                unit = text.split("dgx-sriov-setup.service << 'EOF'\n", 1)[1].split('\nEOF\n', 1)[0]
                commands = []
                for line in unit.replace('\\\n', ' ').splitlines():
                    if not line.startswith('ExecStart=:/bin/bash '):
                        continue
                    # ':' leaves $ to Bash. systemd expands %% and unescapes \\.
                    command = shlex.split(line.partition('=')[2])
                    script = command[-1].replace('%%', '%').replace('\\\\', '\\')
                    script = script.replace('/sys/class/infiniband/', f'{fabric}/')
                    self.assertNotIn('/sys/', script)
                    commands.append(['/bin/bash', *command[1:-1], script])
                self.assertEqual(len(commands), 2)

                counts = []
                slots = []
                for pf in ('mlx5_0', 'mlx5_1'):
                    device = fabric / pf / 'device'
                    device.mkdir(parents=True)
                    count = device / 'sriov_numvfs'
                    count.write_text('0')
                    counts.append(count)
                    for vf in range(8):
                        slot = device / 'sriov' / str(vf)
                        slot.mkdir(parents=True)
                        (slot / 'node').touch()
                        (slot / 'port').touch()
                        slots.append(slot)

                def run(command, prefix=PREFIX):
                    env = dict(os.environ, PFS='mlx5_0 mlx5_1', GUID_PREFIX=prefix)
                    return subprocess.run(command, env=env, capture_output=True, text=True)

                self.assertNotEqual(run(commands[0], '').returncode, 0)
                self.assertEqual(counts[0].read_text(), '0')
                counts[1].write_text('2')
                self.assertNotEqual(run(commands[0]).returncode, 0)
                self.assertEqual(counts[0].read_text(), '0')
                counts[1].write_text('0')
                for _ in range(2):
                    for command in commands:
                        result = run(command)
                        self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual([p.read_text().strip() for p in counts], ['8', '8'])
                    for index, slot in enumerate(slots):
                        for field, suffix in (('node', '01'), ('port', '02')):
                            guid = (slot / field).read_text()
                            self.assertEqual(guid, f'{PREFIX}:{index:02x}:{suffix}\n')


if __name__ == '__main__':
    unittest.main()
