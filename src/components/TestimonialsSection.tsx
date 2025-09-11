import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const testimonials = [
  {
    id: 1,
    name: "Ricardo Almeida",
    role: "Corretor - Santos/SP",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    text: "Com o ConectaIOS consegui triplicar minha carteira de clientes em apenas 3 meses! A automação das ferramentas é incrível."
  },
  {
    id: 2,
    name: "Maria Silva",
    role: "Corretora - Ilhéus/BA",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b332c81c?w=100&h=100&fit=crop&crop=face",
    text: "A plataforma revolucionou minha forma de trabalhar. Agora consigo gerenciar todos os leads de forma organizada e eficiente."
  },
  {
    id: 3,
    name: "Ana Costa",
    role: "Corretora - Itabuna/BA",  
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    text: "Sistema perfeito para quem quer profissionalizar o negócio. Interface linda, funcionalidades completas e suporte excelente!"
  },
  {
    id: 4,
    name: "Carlos Mendes",
    role: "Corretor - Salvador/BA",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    text: "Desde que comecei a usar o ConectaIOS, minha produtividade aumentou 80%. A plataforma é intuitiva e as ferramentas são incríveis!"
  },
  {
    id: 5,
    name: "Lucas Pereira",
    role: "Corretor - São Paulo/SP",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    text: "O melhor investimento que fiz na minha carreira. O ConectaIOS me deu todas as ferramentas para ser um corretor de sucesso!"
  },
  {
    id: 6,
    name: "Fernanda Santos",
    role: "Corretora - Porto Seguro/BA",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    text: "Impressionante como a plataforma facilita o dia a dia. Minhas vendas aumentaram 150% desde que comecei a usar!"
  }
];

export function TestimonialsSection() {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Junte-se a milhares de <span className="text-primary">corretores satisfeitos!</span> ❤️
          </h2>
          <p className="text-lg text-muted-foreground">
            Veja o que andam dizendo sobre nós
          </p>
        </div>

        {/* Carrossel de Depoimentos */}
        <div className="max-w-6xl mx-auto">
          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="text-center space-y-4 p-6 rounded-xl bg-card border hover:shadow-xl transition-all duration-300 hover:scale-105 h-full">
                    {/* Foto */}
                    <div className="flex justify-center">
                      <img 
                        src={testimonial.photo} 
                        alt={testimonial.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                      />
                    </div>
                    
                    {/* Estrelas */}
                    <div className="flex justify-center text-yellow-500 text-lg">
                      ⭐⭐⭐⭐⭐
                    </div>
                    
                    {/* Depoimento */}
                    <blockquote className="text-sm leading-relaxed text-foreground italic min-h-[4rem] flex items-center">
                      "{testimonial.text}"
                    </blockquote>
                    
                    {/* Nome */}
                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-lg text-foreground">{testimonial.name}</h3>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12" />
            <CarouselNext className="hidden md:flex -right-12" />
          </Carousel>
        </div>

        {/* Estatísticas */}
        <div className="text-center mt-12">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-primary">500+</span>
              <span className="text-muted-foreground">Corretores Ativos</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-primary">4.9/5</span>
              <span className="text-muted-foreground">Avaliação Média</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-primary">95%</span>
              <span className="text-muted-foreground">Recomendam</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}