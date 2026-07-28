import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useHelp } from "@/components/help/HelpProvider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Shield, Zap, Lightbulb, PlayCircle } from "lucide-react";

export function HelpDialog() {
  const { activeHelp, closeHelp } = useHelp();

  if (!activeHelp) return null;

  return (
    <Dialog open={!!activeHelp} onOpenChange={(open) => !open && closeHelp()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col gap-0 border-blue-500/20 shadow-2xl shadow-blue-500/10">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-b from-blue-500/5 to-transparent">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Guia do Módulo</span>
          </div>
          <DialogTitle className="text-2xl font-black text-blue-900 dark:text-white uppercase tracking-tighter">
            {activeHelp.summary}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2 leading-relaxed">
            {activeHelp.description}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            <section>
              <h4 className="flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-4">
                <Zap className="w-4 h-4" /> Funcionalidades Chave
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeHelp.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </section>

            {activeHelp.permissions && activeHelp.permissions.length > 0 && (
              <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-4">
                  <Shield className="w-4 h-4" /> Permissões Necessárias
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeHelp.permissions.map((p, i) => (
                    <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {p}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {activeHelp.tips && activeHelp.tips.length > 0 && (
              <section className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                <h4 className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">
                  <Lightbulb className="w-4 h-4" /> Dicas de Utilização
                </h4>
                <ul className="space-y-2">
                  {activeHelp.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-amber-900/80 dark:text-amber-200/80 leading-snug">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {activeHelp.media && activeHelp.media.length > 0 && (
              <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-4">
                  <PlayCircle className="w-4 h-4" /> Tutoriais em Vídeo
                </h4>
                <div className="space-y-4">
                  {activeHelp.media.map((media, i) => (
                    <figure
                      key={`${media.src}-${i}`}
                      className="overflow-hidden rounded-xl border border-blue-500/15 bg-muted/40"
                    >
                      {media.type === "video" && (
                        <video
                          src={media.src}
                          poster={media.poster}
                          controls
                          playsInline
                          muted
                          preload="metadata"
                          className="w-full aspect-video bg-black"
                          aria-label={media.title ?? media.caption ?? "Tutorial em vídeo"}
                        />
                      )}
                      {media.type === "gif" && (
                        <img
                          src={media.src}
                          alt={media.caption ?? media.title ?? "Tutorial animado do módulo"}
                          loading="lazy"
                          className="w-full aspect-video object-cover bg-black"
                        />
                      )}
                      {media.type === "youtube" && (
                        <iframe
                          src={media.src}
                          title={media.title ?? "Tutorial em vídeo"}
                          loading="lazy"
                          allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                          allowFullScreen
                          className="w-full aspect-video border-0 bg-black"
                        />
                      )}
                      {(media.title || media.caption) && (
                        <figcaption className="px-3 py-2 text-xs text-muted-foreground leading-snug">
                          {media.title && (
                            <span className="font-semibold text-foreground">{media.title}. </span>
                          )}
                          {media.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            )}

          </div>
        </ScrollArea>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t flex justify-end">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            ERP Industrial Digitale Têxtil • v1.0
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
