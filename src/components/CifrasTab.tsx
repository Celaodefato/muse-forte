import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Upload, Mic, Loader2, FileAudio, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Cifra {
  id: string;
  name: string;
  lyrics: string;
  chords: string;
  status: 'processing' | 'completed' | 'error';
}

interface CifrasTabProps {
  cifras: Cifra[];
  onAddCifra: (cifra: Cifra) => void;
  onRemoveCifra: (id: string) => void;
}

export const CifrasTab = ({ cifras, onAddCifra, onRemoveCifra }: CifrasTabProps) => {
  const [selectedCifra, setSelectedCifra] = useState<Cifra | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type.includes('audio') || file.type.includes('video'))) {
      setIsProcessing(true);
      
      // Create a placeholder cifra while "processing"
      const newCifra: Cifra = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.(mp3|mp4|wav|m4a)$/i, ''),
        lyrics: '',
        chords: '',
        status: 'processing',
      };
      
      onAddCifra(newCifra);
      toast.info('Processando música... A IA está transcrevendo!');
      
      // Simulate AI processing (in real implementation, this would call the backend)
      setTimeout(() => {
        const updatedCifra: Cifra = {
          ...newCifra,
          status: 'completed',
          lyrics: `[Verso 1]
Am        G           C
Exemplo de cifra gerada pela IA
F            G         Am
A música foi transcrita automaticamente
          
[Refrão]
C          G          Am
Esta é uma demonstração
F          G          C
Do poder da inteligência artificial`,
          chords: 'Am, G, C, F',
        };
        
        onAddCifra(updatedCifra);
        setIsProcessing(false);
        toast.success('Cifra gerada com sucesso!');
      }, 3000);
    } else {
      toast.error('Por favor, selecione um arquivo de áudio (MP3) ou vídeo (MP4).');
    }
    e.target.value = '';
  }, [onAddCifra]);

  if (selectedCifra) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 glass-panel mb-4">
          <Button variant="ghost" onClick={() => setSelectedCifra(null)}>
            <Music2 className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          <h2 className="font-display text-lg neon-text-magenta">{selectedCifra.name}</h2>
          <div className="flex items-center gap-2 text-secondary">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Gerado por IA</span>
          </div>
        </div>

        {/* Cifra Content */}
        <div className="flex-1 glass-panel rounded-xl p-6 overflow-auto">
          <div className="mb-4 pb-4 border-b border-border">
            <h3 className="font-display text-sm text-muted-foreground mb-2">ACORDES USADOS</h3>
            <div className="flex gap-2 flex-wrap">
              {selectedCifra.chords.split(', ').map((chord, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-secondary/20 text-secondary border border-secondary/30 font-display text-sm">
                  {chord}
                </span>
              ))}
            </div>
          </div>
          
          <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {selectedCifra.lyrics}
          </pre>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col gap-6"
    >
      {/* Upload Area */}
      <label className={`glass-panel p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer group hover-glow ${
        isProcessing ? 'border-secondary/60 pointer-events-none' : 'border-secondary/30 hover:border-secondary/60'
      }`}>
        <input
          type="file"
          accept="audio/*,video/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isProcessing}
        />
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-secondary animate-spin" />
            ) : (
              <Mic className="w-8 h-8 text-secondary" />
            )}
          </div>
          <div>
            <p className="font-display text-lg text-foreground">
              {isProcessing ? 'Processando com IA...' : 'Envie sua música'}
            </p>
            <p className="text-muted-foreground text-sm">
              {isProcessing ? 'Transcrevendo e cifrando' : 'MP3, MP4, WAV ou M4A'}
            </p>
          </div>
        </div>
      </label>

      {/* Info Banner */}
      <div className="glass-panel p-4 rounded-xl border border-secondary/30 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
        <div>
          <p className="font-display text-sm text-secondary mb-1">Powered by AI</p>
          <p className="text-xs text-muted-foreground">
            A IA vai ouvir sua música, transcrever a letra e gerar as cifras automaticamente no estilo Cifra Club.
          </p>
        </div>
      </div>

      {/* Cifras List */}
      <div className="flex-1 overflow-auto">
        <h3 className="font-display text-xl mb-4 neon-text-magenta flex items-center gap-2">
          <Music2 className="w-5 h-5" />
          Suas Cifras
        </h3>

        {cifras.length === 0 ? (
          <div className="glass-panel p-8 rounded-xl text-center">
            <FileAudio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma cifra ainda</p>
            <p className="text-sm text-muted-foreground/60">Envie uma música para gerar cifras</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence>
              {cifras.map((cifra, index) => (
                <motion.div
                  key={cifra.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-panel p-4 rounded-xl flex items-center justify-between hover-glow group ${
                    cifra.status === 'completed' ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => cifra.status === 'completed' && setSelectedCifra(cifra)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      cifra.status === 'processing' ? 'bg-muted' : 'bg-secondary/10'
                    }`}>
                      {cifra.status === 'processing' ? (
                        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                      ) : (
                        <Music2 className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium block">{cifra.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {cifra.status === 'processing' ? 'Processando...' : cifra.chords}
                      </span>
                    </div>
                  </div>
                  {cifra.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCifra(cifra.id);
                        toast.success('Cifra removida');
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};
