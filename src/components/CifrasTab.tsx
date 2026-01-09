import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Loader2, FileAudio, Trash2, Sparkles, ChevronLeft, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
      
      const cifraId = crypto.randomUUID();
      const fileName = file.name.replace(/\.(mp3|mp4|wav|m4a)$/i, '');
      
      const newCifra: Cifra = {
        id: cifraId,
        name: fileName,
        lyrics: '',
        chords: '',
        status: 'processing',
      };
      
      onAddCifra(newCifra);
      toast.info('Processando música com IA...');
      
      try {
        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const audioBase64 = btoa(binary);

        // Call the edge function with mimeType for proper audio processing
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audioBase64, fileName, mimeType: file.type }
        });

        if (error) throw error;

        if (data?.success) {
          const updatedCifra: Cifra = {
            id: cifraId,
            name: fileName,
            status: 'completed',
            lyrics: data.lyrics || 'Não foi possível transcrever a letra.',
            chords: data.chords?.join(', ') || 'Acordes não identificados',
          };
          
          onAddCifra(updatedCifra);
          toast.success('Cifra gerada com sucesso!');
        } else {
          throw new Error(data?.error || 'Erro ao processar');
        }
      } catch (error) {
        console.error('Error transcribing:', error);
        const errorCifra: Cifra = {
          id: cifraId,
          name: fileName,
          status: 'error',
          lyrics: 'Erro ao processar a música. Tente novamente.',
          chords: '',
        };
        onAddCifra(errorCifra);
        toast.error('Erro ao processar a música');
      } finally {
        setIsProcessing(false);
      }
    } else {
      toast.error('Selecione um arquivo de áudio ou vídeo');
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
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSelectedCifra(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <div className="flex items-center gap-1.5 text-secondary">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">IA</span>
          </div>
        </div>

        {/* Song Title */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">{selectedCifra.name}</h2>
        </div>

        {/* Chords Used */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Acordes</p>
          <div className="flex gap-2 flex-wrap">
            {selectedCifra.chords.split(', ').map((chord, i) => (
              <span 
                key={i} 
                className="px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary border border-secondary/20 text-sm font-medium"
              >
                {chord}
              </span>
            ))}
          </div>
        </div>

        {/* Cifra Content */}
        <div className="flex-1 glass-panel p-5 overflow-auto">
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
      <label className={`glass-panel p-6 border-2 border-dashed transition-all cursor-pointer group hover-lift ${
        isProcessing ? 'border-secondary/40 pointer-events-none' : 'border-secondary/20 hover:border-secondary/40'
      }`}>
        <input
          type="file"
          accept="audio/*,video/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={isProcessing}
        />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
            {isProcessing ? (
              <Loader2 className="w-6 h-6 text-secondary animate-spin" />
            ) : (
              <Wand2 className="w-6 h-6 text-secondary" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {isProcessing ? 'Processando...' : 'Gerar cifra com IA'}
            </p>
            <p className="text-muted-foreground text-sm">
              {isProcessing ? 'Transcrevendo e cifrando' : 'Envie MP3, MP4, WAV ou M4A'}
            </p>
          </div>
        </div>
      </label>

      {/* Info Card */}
      <div className="glass-panel p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-secondary" />
        </div>
        <div>
          <p className="font-medium text-sm mb-0.5">Powered by AI</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Envie sua música e a IA vai transcrever a letra e gerar as cifras automaticamente.
          </p>
        </div>
      </div>

      {/* Cifras List */}
      <div className="flex-1 overflow-auto">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Music2 className="w-4 h-4" />
          Suas Cifras
        </h3>

        {cifras.length === 0 ? (
          <div className="glass-panel p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <FileAudio className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-1">Nenhuma cifra</p>
            <p className="text-sm text-muted-foreground">Envie uma música para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {cifras.map((cifra, index) => (
                <motion.div
                  key={cifra.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`glass-panel p-4 flex items-center justify-between hover-lift group ${
                    cifra.status === 'completed' ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => cifra.status === 'completed' && setSelectedCifra(cifra)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      cifra.status === 'processing' ? 'bg-muted' : 'bg-secondary/10'
                    }`}>
                      {cifra.status === 'processing' ? (
                        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                      ) : (
                        <Music2 className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cifra.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cifra.status === 'processing' ? 'Processando...' : cifra.chords}
                      </p>
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
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
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
