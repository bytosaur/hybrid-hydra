import librosa
import librosa.display
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.ticker import NullFormatter, NullLocator


def format_frequency_label(freq_hz):
    if freq_hz >= 1000:
        return f"{freq_hz / 1000:g}k"
    return f"{int(freq_hz)}"

def plot_paper_spectrogram(wav_path, save_path="spectrogram.pdf", dpi=300):
    """
    Generates a publication-quality spectrogram from a .wav file.
    Saves as vector graphics (PDF) by default for infinite scalability in LaTeX/Word.
    """
    # 1. Journal Styling Setup (IEEE/Nature/Elsevier standard guidelines)
    plt.rcParams.update({
        "font.family": "serif",        # Serif fonts look professional in papers
        "font.serif": ["Times New Roman", "DejaVu Serif"],
        "font.size": 20,               # Standard body text reference size
        "axes.labelsize": 22,          # Slightly larger axis labels
        "axes.titlesize": 22,
        "xtick.labelsize": 18,
        "ytick.labelsize": 18,
        "figure.titlesize": 22
    })

    # 2. Load Audio (Forces mono and preserves native sample rate)
    y, sr = librosa.load(wav_path, sr=None, mono=True)
    
    
    # 3. Compute Short-Time Fourier Transform (STFT)
    # n_fft and hop_length balance time/frequency resolution
    n_fft = 2048
    hop_length = 512
    stft_matrix = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
    
    
    # Convert amplitude to Decibels (dB) relative to peak power
    stft_db = librosa.amplitude_to_db(np.abs(stft_matrix), ref=np.max)

    # 4. Initialize Plot Frame
    # 3.5 inches matches a standard single-column width for double-column papers
    fig, ax = plt.subplots(figsize=(10, 5.5), layout="constrained")
    
    # 5. Display Spectrogram
    # 'magma' or 'viridis' are perceptually uniform and print well in grayscale
    img = librosa.display.specshow(
        stft_db, 
        sr=sr, 
        hop_length=hop_length, 
        x_axis="time", 
        y_axis="log", 
        ax=ax, 
        cmap="magma",
        # vmax=0,       # Sets top of dB scale to 0 (peak)
        # vmin=-60      # Clean floor to hide low-level background noise
    )
    
    hlines= [60, 120, 240, 480, 960, 3840, 15360]
    # for h in hlines:
    #     ax.axhline(h, color="w", linestyle="--", linewidth=1)

    # 6. Refine Labels & Aesthetics
    ax.set_xlabel("Target Frequency (Hz)")
    ax.set_ylabel("Audio Frequency (Hz)")

    # Remap time axis ticks to sweep frequency using:
    # f(t) = 10 ** ((t / 10) % 4.3)
    t_min, t_max = ax.get_xlim()
    base_tick_freqs = [15, 30, 60, 120, 240, 480, 960, 3840, 15360]
    x_ticks = []
    x_tick_labels = []
    cycle = 0
    while True:
        cycle_offset = 4.3 * cycle
        cycle_has_tick = False
        for freq_hz in base_tick_freqs:
            sweep_time = 10.0 * (np.log10(freq_hz) + cycle_offset)
            if t_min <= sweep_time <= t_max:
                x_ticks.append(sweep_time)
                x_tick_labels.append(format_frequency_label(freq_hz))
                cycle_has_tick = True
        if not cycle_has_tick and (10.0 * cycle_offset) > t_max:
            break
        cycle += 1

    if x_ticks:
        ax.set_xticks(x_ticks)
        ax.set_xticklabels(x_tick_labels)

    ax.set_yticks(hlines)
    ax.set_yticklabels(["60", "120", "240", "480", "960", "3.84k", "15.36k"])
    # Hide minor y ticks from log/mel scales to avoid duplicate short tick marks.
    ax.yaxis.set_minor_locator(NullLocator())
    ax.yaxis.set_minor_formatter(NullFormatter())
    # ax.set_yticklabels(["1.5k", "3k", "6k", "12k", "18k"])
    # dashed grid lines for better readability in print
    ax.grid(color='w', linewidth=1, alpha=0.8, linestyle='--')

    # 7. Add Scientific Colorbar
    cbar = fig.colorbar(img, ax=ax, format="%+0.0f dB")
    cbar.ax.tick_params(pad=8)
    cbar.ax.set_ylabel("Magnitude (dB)", rotation=270, labelpad=30)

    # 8. Save High-Resolution Asset
    # Using .pdf or .eps ensures the image won't pixelate when zoomed in a PDF reader
    plt.savefig(save_path, dpi=dpi, bbox_inches="tight")
    plt.close()
    print(f"Publication-ready spectrogram saved to {save_path}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate a publication-quality spectrogram from a .wav file.")
    parser.add_argument("wav_path", type=str, help="Path to the input .wav file.")
    parser.add_argument("-s", "--save_path", type=str, default="spectrogram.pdf", help="Path to save the output spectrogram (default: spectrogram.pdf).")
    parser.add_argument("-d", "--dpi", type=int, default=500, help="DPI for the output file (default: 300).")
    args = parser.parse_args()
    plot_paper_spectrogram(args.wav_path, args.save_path, args.dpi)