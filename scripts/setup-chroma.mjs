import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

// Match the original site's Chroma lexer and Monokai token rendering.
const version = '2.23.1';
const platform = `${process.platform}-${{x64: 'amd64', arm64: 'arm64'}[process.arch]}`;
const checksums = {
 'darwin-amd64': 'af28281bd400df4d0ae8245df48ee4d3dc2dee3d455ad2efc25286303ae8ba1b',
 'darwin-arm64': '1f6a37d6f8c54aca56c6448f4494c4235a19ad4f7d6de2e7cd0755868e016901',
 'linux-amd64': 'ee7ffac6c8935d21d28f6781111d0b814fe60a57cca5a36460e830e4cc6001a0',
 'linux-arm64': 'f8ed6d6f451d5bab246b66136f96e17271d5100f28fc38c5a74add9ac48c887e',
};
if (!checksums[platform]) throw new Error(`Unsupported Chroma build platform: ${platform}`);
const directory = path.resolve('node_modules/.cache/chroma');
mkdirSync(directory, {recursive: true});
const name = `chroma-${version}-${platform}.tar.gz`, archive = path.join(directory, name);
if (!existsSync(archive)) {
 const response = await fetch(`https://github.com/alecthomas/chroma/releases/download/v${version}/${name}`, {signal: AbortSignal.timeout(120000)});
 if (!response.ok) throw new Error(`Chroma download failed: ${response.status}`);
 const bytes = Buffer.from(await response.arrayBuffer());
 if (createHash('sha256').update(bytes).digest('hex') !== checksums[platform]) throw new Error('Chroma archive checksum mismatch');
 writeFileSync(archive, bytes);
}
if (createHash('sha256').update(readFileSync(archive)).digest('hex') !== checksums[platform]) throw new Error('Cached Chroma archive checksum mismatch');
// Re-extract from the verified archive instead of trusting a cached executable.
execFileSync('tar', ['-xzf', archive, '-C', directory]);
const installed = execFileSync(path.join(directory, 'chroma'), ['--version'], {encoding: 'utf8'});
if (!installed.includes(version)) throw new Error(`Unexpected Chroma version: ${installed}`);
