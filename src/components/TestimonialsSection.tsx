const testimonials = [
  {
    id: 1,
    name: "Juliana Rodrigues",
    role: "Corretora Autônoma",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face",
    text: "A integração com bancos para financiamento facilitou muito meu trabalho. Consigo fechar negócios com muito mais agilidade."
  },
  {
    id: 2,
    name: "Ricardo Almeida",  
    role: "Gerente de Vendas",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    text: "Equipe toda usando o ConectaIOS. Organização total dos leads e acompanhamento em tempo real. Resultado: 60% mais contratos!"
  },
  {
    id: 3,
    name: "Patrícia Oliveira",
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
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-background">
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

        {/* Grid de Depoimentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <div 
              key={testimonial.id}
              className="text-center space-y-4 p-6 rounded-lg bg-card border hover:shadow-lg transition-shadow duration-300"
            >
              {/* Foto */}
              <div className="flex justify-center">
                <img 
                  src={testimonial.photo} 
                  alt={testimonial.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
                />
              </div>
              
              {/* Nome */}
              <div>
                <h3 className="font-semibold text-lg text-foreground">{testimonial.name}</h3>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
              
              {/* Depoimento */}
              <blockquote className="text-sm leading-relaxed text-foreground italic">
                "{testimonial.text}"
              </blockquote>
            </div>
          ))}
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