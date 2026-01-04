import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Music2 } from 'lucide-react';
import { PartiturasTab } from '@/components/PartiturasTab';
import { CifrasTab } from '@/components/CifrasTab';

type Tab = 'partituras' | 'cifras';

interface SheetMusic {
  id: string;
  name: string;
  file: File;
  url: string;
}

interface Cifra {
  id: string;
  name: string;
  lyrics: string;
  chords: string;
  status: 'processing' | 'completed' | 'error';
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('partituras');
  const [sheets, setSheets] = useState<SheetMusic[]>([]);
  const [cifras, setCifras] = useState<Cifra[]>([]);

  const handleAddSheet = (sheet: SheetMusic) => {
    setSheets(prev => [...prev, sheet]);
  };

  const handleRemoveSheet = (id: string) => {
    setSheets(prev => prev.filter(s => s.id !== id));
  };

  const handleAddCifra = (cifra: Cifra) => {
    setCifras(prev => {
      const existing = prev.findIndex(c => c.id === cifra.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = cifra;
        return updated;
      }
      return [...prev, cifra];
    });
  };

  const handleRemoveCifra = (id: string) => {
    setCifras(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-background scanline">
      {/* Ambient Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-neon" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-pulse-neon" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-5xl font-bold mb-2">
            <span className="neon-text">M</span>
            <span className="neon-text-magenta">F</span>
          </h1>
          <p className="text-muted-foreground font-light tracking-widest uppercase text-sm">
            Music Folio
          </p>
        </motion.header>

        {/* Tab Navigation */}
        <motion.nav
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-1.5 rounded-2xl mb-6"
        >
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('partituras')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-display text-sm uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'partituras'
                  ? 'bg-primary text-primary-foreground neon-glow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <FileText className="w-4 h-4" />
              Partituras
            </button>
            <button
              onClick={() => setActiveTab('cifras')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-display text-sm uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'cifras'
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
              style={activeTab === 'cifras' ? { boxShadow: '0 0 20px hsla(320, 100%, 50%, 0.5)' } : {}}
            >
              <Music2 className="w-4 h-4" />
              Cifras
            </button>
          </div>
        </motion.nav>

        {/* Tab Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'partituras' ? (
              <PartiturasTab
                key="partituras"
                sheets={sheets}
                onAddSheet={handleAddSheet}
                onRemoveSheet={handleRemoveSheet}
              />
            ) : (
              <CifrasTab
                key="cifras"
                cifras={cifras}
                onAddCifra={handleAddCifra}
                onRemoveCifra={handleRemoveCifra}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-6 mt-auto"
        >
          <p className="text-muted-foreground/50 text-xs font-display tracking-widest uppercase">
            Powered by AI
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
