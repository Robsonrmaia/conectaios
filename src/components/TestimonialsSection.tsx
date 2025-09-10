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
  }
];

export function TestimonialsSection() {

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold mb-3">
            O que nossos <span className="text-primary">corretores</span> dizem
          </h2>
          <p className="text-muted-foreground">
            Mais de <strong>500+ corretores</strong> já transformaram seus negócios
          </p>
        </div>

        <div className="flex overflow-x-auto gap-4 max-w-4xl mx-auto pb-2">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id}
              className="flex-shrink-0 bg-muted/30 rounded-lg p-4 min-w-[280px] border"
            >
              <div className="flex items-start gap-3">
                <img 
                  src={testimonial.photo} 
                  alt={testimonial.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{testimonial.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{testimonial.role}</p>
                  <p className="text-sm leading-relaxed text-foreground">
                    {testimonial.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span><strong>4.9/5</strong> avaliação média</span>
            <span><strong>500+</strong> corretores ativos</span>
            <span><strong>95%</strong> recomendam</span>
          </div>
        </div>
      </div>
    </section>
  );
}