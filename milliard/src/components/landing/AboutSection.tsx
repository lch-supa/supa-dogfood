import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="py-8 px-4 bg-secondary/30">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6"
        >
          <div className="h-px w-24 bg-gold/50 mx-auto" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center"
        >
          <blockquote className="text-xl italic text-foreground/90 leading-relaxed mb-4 text-center max-w-3xl">
            We are perhaps not so very "anti" [-randomness]. I would prefer
            to say that we display a certain suspicion with regard to chance.
          </blockquote>
          <p className="text-base text-muted-foreground text-center">
            — <a href="https://pdfs.semanticscholar.org/e2e8/a697002992d4aa8261ead9d23b01f286dae6.pdf" target="_blank">Raymond Queneau</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
