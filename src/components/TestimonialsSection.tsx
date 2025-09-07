import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Ana Carolina Silva",
    role: "Corretora - Ilhéus/BA",
    avatar: "👩‍💼",
    rating: 5,
    text: "O ConectaIOS revolucionou minha forma de trabalhar! Consegui organizar todos os meus clientes e aumentei minhas vendas em 40% nos últimos 3 meses.",
    highlight: "Aumento de 40% nas vendas"
  },
  {
    id: 2,
    name: "Roberto Mendes",
    role: "Corretor Independente",
    avatar: "👨‍💼",
    rating: 5,
    text: "A ferramenta de match inteligente é incrível! Ela conecta automaticamente meus clientes aos imóveis perfeitos. Economia de tempo fantástica.",
    highlight: "Match inteligente excepcional"
  },
  {
    id: 3,
    name: "Marina Costa",
    role: "Equipe Costa Imóveis",
    avatar: "👩‍🦱",
    rating: 5,
    text: "O CRM completo e o minisite personalizado me deram uma presença profissional incrível. Meus clientes ficam impressionados!",
    highlight: "Presença profissional"
  },
  {
    id: 4,
    name: "João Paulo Santos",
    role: "Corretor - Salvador/BA",
    avatar: "👨‍🎓",
    rating: 5,
    text: "As fotos com IA e virtual staging fazem toda a diferença. Meus imóveis se destacam no mercado e vendem muito mais rápido!",
    highlight: "Vendas mais rápidas"
  },
  {
    id: 5,
    name: "Fernanda Lima",
    role: "Corretora de Luxo",
    avatar: "👩‍💻",
    rating: 5,
    text: "Sistema completo e intuitivo. Consegui aumentar minha carteira de clientes premium usando as ferramentas de marketing integradas.",
    highlight: "Clientes premium"
  },
  {
    id: 6,
    name: "Carlos Eduardo",
    role: "Corretor - Região Sul",
    avatar: "👨‍🏫",
    rating: 5,
    text: "O chat em tempo real me permite responder clientes instantaneamente. Nunca perco uma oportunidade de negócio!",
    highlight: "Nunca perde oportunidades"
  },
  {
    id: 7,
    name: "Juliana Rodrigues",
    role: "Corretora Autônoma",
    avatar: "👩‍🔬",
    rating: 5,
    text: "A integração com bancos para financiamento facilitou muito meu trabalho. Consigo fechar negócios com muito mais agilidade.",
    highlight: "Fechamento ágil"
  },
  {
    id: 8,
    name: "Ricardo Almeida",  
    role: "Gerente de Vendas",
    avatar: "👨‍💼",
    rating: 5,
    text: "Equipe toda usando o ConectaIOS. Organização total dos leads e acompanhamento em tempo real. Resultado: 60% mais contratos!",
    highlight: "60% mais contratos"
  },
  {
    id: 9,
    name: "Patrícia Oliveira",
    role: "Corretora - Itabuna/BA",  
    avatar: "👩‍⚕️",
    rating: 5,
    text: "Sistema perfeito para quem quer profissionalizar o negócio. Interface linda, funcionalidades completas e suporte excelente!",
    highlight: "Profissionalização total"
  }
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 3) % testimonials.length);
    }, 4000); // Muda a cada 4 segundos

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const visibleTestimonials = [
    testimonials[currentIndex],
    testimonials[(currentIndex + 1) % testimonials.length],
    testimonials[(currentIndex + 2) % testimonials.length]
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <section className="py-16 bg-gradient-to-br from-background to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que nossos <span className="text-primary">corretores</span> dizem
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mais de <strong>500+ corretores</strong> já transformaram seus negócios com o ConectaIOS
          </p>
        </div>

        <div 
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {visibleTestimonials.map((testimonial, index) => (
            <Card 
              key={`${testimonial.id}-${currentIndex}`}
              className="relative overflow-hidden hover:shadow-xl transition-all duration-500 border-2 hover:border-primary/20 bg-card/50 backdrop-blur-sm animate-fade-in"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                transform: `translateY(${index === 1 ? '-10px' : '0'})` // Destaque o do meio
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{testimonial.avatar}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{testimonial.name}</h4>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                  <Quote className="h-6 w-6 text-primary/30" />
                </div>
                
                <div className="flex mb-3">
                  {renderStars(testimonial.rating)}
                </div>
                
                <blockquote className="text-sm leading-relaxed mb-4 italic">
                  "{testimonial.text}"
                </blockquote>
                
                <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                  ✨ {testimonial.highlight}
                </div>
              </CardContent>
              
              {/* Destaque visual para o card do meio */}
              {index === 1 && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                    ⭐ Destaque
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Indicadores */}
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: Math.ceil(testimonials.length / 3) }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i * 3);
                setIsAutoPlaying(false);
              }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                Math.floor(currentIndex / 3) === i 
                  ? 'bg-primary' 
                  : 'bg-primary/30 hover:bg-primary/50'
              }`}
            />
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Junte-se a centenas de corretores que já transformaram seus negócios
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <strong>4.9/5</strong> avaliação média
            </span>
            <span>•</span>
            <span><strong>500+</strong> corretores ativos</span>
            <span>•</span>
            <span><strong>95%</strong> recomendam</span>
          </div>
        </div>
      </div>
    </section>
  );
}