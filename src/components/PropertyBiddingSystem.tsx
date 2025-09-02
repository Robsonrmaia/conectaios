import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Gavel, 
  Trophy, 
  Users,
  Timer,
  AlertTriangle,
  CheckCircle,
  Building2
} from 'lucide-react';
import { formatDistanceToNow, formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { formatCurrency, parseValueInput } from '@/lib/utils';

interface Bid {
  id: string;
  auction_id: string;
  bidder_name: string;
  bidder_email: string;
  bidder_phone: string;
  amount: number;
  created_at: string;
  is_winning: boolean;
}

interface Auction {
  id: string;
  property_id: string;
  property_title: string;
  property_images: string[];
  starting_price: number;
  reserve_price: number;
  current_highest_bid: number;
  minimum_increment: number;
  starts_at: string;
  ends_at: string;
  status: string; // upcoming, active, ended, cancelled
  total_bids: number;
  winner_name?: string;
  bids: Bid[];
}

interface PropertyBiddingSystemProps {
  propertyId?: string;
  mode?: 'manage' | 'participate';
}

export function PropertyBiddingSystem({
  propertyId,
  mode = 'manage'
}: PropertyBiddingSystemProps) {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({});

  const [auctionForm, setAuctionForm] = useState({
    property_title: '',
    starting_price: '',
    reserve_price: '',
    minimum_increment: '',
    duration_hours: '24',
    description: ''
  });

  const [bidForm, setBidForm] = useState({
    bidder_name: '',
    bidder_email: '',
    bidder_phone: '',
    bid_amount: ''
  });

  useEffect(() => {
    fetchAuctions();
    
    // Update timers every second
    const timer = setInterval(updateTimers, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateTimers = () => {
    const newTimeLeft: Record<string, string> = {};
    
    auctions.forEach(auction => {
      if (auction.status === 'active') {
        const endTime = new Date(auction.ends_at);
        const now = new Date();
        
        if (endTime > now) {
          const timeRemaining = formatDistanceStrict(now, endTime);
          newTimeLeft[auction.id] = timeRemaining;
        } else {
          newTimeLeft[auction.id] = 'Encerrado';
        }
      } else if (auction.status === 'upcoming') {
        const startTime = new Date(auction.starts_at);
        const now = new Date();
        
        if (startTime > now) {
          const timeToStart = formatDistanceStrict(now, startTime);
          newTimeLeft[auction.id] = `Inicia em ${timeToStart}`;
        }
      }
    });
    
    setTimeLeft(newTimeLeft);
  };

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      // Simulated data for demonstration
      const mockAuctions: Auction[] = [
        {
          id: '1',
          property_id: propertyId || 'prop-1',
          property_title: 'Apartamento 3 quartos Vila Madalena',
          property_images: [],
          starting_price: 500000,
          reserve_price: 600000,
          current_highest_bid: 575000,
          minimum_increment: 5000,
          starts_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          ends_at: new Date(Date.now() + 1000 * 60 * 60 * 23).toISOString(),
          status: 'active',
          total_bids: 12,
          bids: [
            {
              id: 'bid-1',
              auction_id: '1',
              bidder_name: 'João Silva',
              bidder_email: 'joao@email.com',
              bidder_phone: '(11) 99999-9999',
              amount: 575000,
              created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              is_winning: true
            },
            {
              id: 'bid-2',
              auction_id: '1',
              bidder_name: 'Maria Santos',
              bidder_email: 'maria@email.com',
              bidder_phone: '(11) 88888-8888',
              amount: 570000,
              created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
              is_winning: false
            }
          ]
        },
        {
          id: '2',
          property_id: 'prop-2',
          property_title: 'Casa 4 quartos Jardins',
          property_images: [],
          starting_price: 800000,
          reserve_price: 950000,
          current_highest_bid: 820000,
          minimum_increment: 10000,
          starts_at: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
          ends_at: new Date(Date.now() + 1000 * 60 * 60 * 26).toISOString(),
          status: 'upcoming',
          total_bids: 0,
          bids: []
        }
      ];

      setAuctions(mockAuctions);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar leilões",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAuction = async () => {
    if (!auctionForm.property_title || !auctionForm.starting_price) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newAuction: Auction = {
        id: Date.now().toString(),
        property_id: propertyId || 'new-prop',
        property_title: auctionForm.property_title,
        property_images: [],
        starting_price: parseValueInput(auctionForm.starting_price),
        reserve_price: parseValueInput(auctionForm.reserve_price) || parseValueInput(auctionForm.starting_price),
        current_highest_bid: 0,
        minimum_increment: parseValueInput(auctionForm.minimum_increment) || 1000,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 1000 * 60 * 60 * parseInt(auctionForm.duration_hours)).toISOString(),
        status: 'active',
        total_bids: 0,
        bids: []
      };

      setAuctions(prev => [newAuction, ...prev]);

      toast({
        title: "Leilão criado!",
        description: "O leilão foi iniciado com sucesso",
      });

      setIsCreateDialogOpen(false);
      setAuctionForm({
        property_title: '',
        starting_price: '',
        reserve_price: '',
        minimum_increment: '',
        duration_hours: '24',
        description: ''
      });
    } catch (error) {
      console.error('Error creating auction:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar leilão",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const placeBid = async () => {
    if (!selectedAuction || !bidForm.bid_amount || !bidForm.bidder_name) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const bidAmount = parseValueInput(bidForm.bid_amount);
    const minBid = selectedAuction.current_highest_bid + selectedAuction.minimum_increment;

    if (bidAmount < minBid) {
      toast({
        title: "Lance muito baixo",
        description: `O lance mínimo é ${formatCurrency(minBid)}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newBid: Bid = {
        id: Date.now().toString(),
        auction_id: selectedAuction.id,
        bidder_name: bidForm.bidder_name,
        bidder_email: bidForm.bidder_email,
        bidder_phone: bidForm.bidder_phone,
        amount: bidAmount,
        created_at: new Date().toISOString(),
        is_winning: true
      };

      // Update auctions with new bid
      setAuctions(prev => prev.map(auction => {
        if (auction.id === selectedAuction.id) {
          // Mark all previous bids as not winning
          const updatedBids = auction.bids.map(bid => ({ ...bid, is_winning: false }));
          return {
            ...auction,
            bids: [newBid, ...updatedBids],
            current_highest_bid: bidAmount,
            total_bids: auction.total_bids + 1
          };
        }
        return auction;
      }));

      toast({
        title: "Lance realizado!",
        description: `Seu lance de ${formatCurrency(bidAmount)} foi registrado`,
      });

      setIsBidDialogOpen(false);
      setBidForm({
        bidder_name: '',
        bidder_email: '',
        bidder_phone: '',
        bid_amount: ''
      });
    } catch (error) {
      console.error('Error placing bid:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar lance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="secondary">Próximo</Badge>;
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'ended':
        return <Badge variant="outline">Encerrado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isAuctionActive = (auction: Auction) => {
    const now = new Date();
    const endTime = new Date(auction.ends_at);
    return auction.status === 'active' && endTime > now;
  };

  const getWinningBid = (auction: Auction) => {
    return auction.bids.find(bid => bid.is_winning);
  };

  if (loading && auctions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gavel className="h-7 w-7" />
            Sistema de Lances
          </h2>
          <p className="text-muted-foreground">
            {mode === 'manage' ? 'Gerencie leilões de imóveis' : 'Participe de leilões ativos'}
          </p>
        </div>
        
        {mode === 'manage' && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-brand-secondary">
                <Gavel className="h-4 w-4 mr-2" />
                Criar Leilão
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Novo Leilão</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="property_title">Título do Imóvel *</Label>
                  <Input
                    id="property_title"
                    value={auctionForm.property_title}
                    onChange={(e) => setAuctionForm({...auctionForm, property_title: e.target.value})}
                    placeholder="Apartamento 3 quartos..."
                  />
                </div>
                <div>
                  <Label htmlFor="starting_price">Preço Inicial *</Label>
                  <Input
                    id="starting_price"
                    value={auctionForm.starting_price}
                    onChange={(e) => setAuctionForm({...auctionForm, starting_price: e.target.value})}
                    placeholder="500.000,00"
                  />
                </div>
                <div>
                  <Label htmlFor="reserve_price">Preço de Reserva</Label>
                  <Input
                    id="reserve_price"
                    value={auctionForm.reserve_price}
                    onChange={(e) => setAuctionForm({...auctionForm, reserve_price: e.target.value})}
                    placeholder="600.000,00"
                  />
                </div>
                <div>
                  <Label htmlFor="minimum_increment">Incremento Mínimo</Label>
                  <Input
                    id="minimum_increment"
                    value={auctionForm.minimum_increment}
                    onChange={(e) => setAuctionForm({...auctionForm, minimum_increment: e.target.value})}
                    placeholder="5.000,00"
                  />
                </div>
                <div>
                  <Label htmlFor="duration_hours">Duração (horas)</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    value={auctionForm.duration_hours}
                    onChange={(e) => setAuctionForm({...auctionForm, duration_hours: e.target.value})}
                    min="1"
                    max="168"
                  />
                </div>
                <Button onClick={createAuction} disabled={loading} className="w-full">
                  Criar Leilão
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Auctions List */}
      <div className="space-y-4">
        {auctions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum leilão encontrado</h3>
              <p className="text-muted-foreground">
                {mode === 'manage' ? 'Crie seu primeiro leilão' : 'Não há leilões ativos no momento'}
              </p>
            </CardContent>
          </Card>
        ) : (
          auctions.map((auction) => {
            const winningBid = getWinningBid(auction);
            const active = isAuctionActive(auction);
            
            return (
              <Card key={auction.id} className={`${!active && auction.status === 'ended' ? 'opacity-80' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {auction.property_title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {auction.total_bids} lances • Incremento mín: {formatCurrency(auction.minimum_increment)}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(auction.status)}
                      {timeLeft[auction.id] && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {timeLeft[auction.id]}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Price Information */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-xs">Preço Inicial</Label>
                      <p className="font-semibold">{formatCurrency(auction.starting_price)}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Lance Atual</Label>
                      <p className="font-bold text-lg text-primary">
                        {auction.current_highest_bid > 0 
                          ? formatCurrency(auction.current_highest_bid)
                          : 'Sem lances'
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Preço de Reserva</Label>
                      <p className="font-semibold">{formatCurrency(auction.reserve_price)}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Próximo Lance Mín.</Label>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(auction.current_highest_bid + auction.minimum_increment)}
                      </p>
                    </div>
                  </div>

                  {/* Reserve Price Alert */}
                  {auction.current_highest_bid > 0 && auction.current_highest_bid < auction.reserve_price && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Lance atual está abaixo do preço de reserva ({formatCurrency(auction.reserve_price)})
                      </AlertDescription>
                    </Alert>
                  )}

                  {auction.current_highest_bid >= auction.reserve_price && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Preço de reserva atingido! Este imóvel será vendido para o maior lance.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Winning Bidder */}
                  {winningBid && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">Lance Vencedor</span>
                      </div>
                      <div className="text-sm">
                        <p><strong>{winningBid.bidder_name}</strong></p>
                        <p className="text-muted-foreground">
                          {formatDistanceToNow(new Date(winningBid.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recent Bids */}
                  {auction.bids.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Histórico de Lances ({auction.bids.length})
                      </h4>
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {auction.bids.slice(0, 5).map((bid) => (
                            <div key={bid.id} className="flex justify-between items-center p-2 border rounded">
                              <div>
                                <span className="font-medium">{bid.bidder_name}</span>
                                {bid.is_winning && (
                                  <Trophy className="inline h-3 w-3 text-yellow-500 ml-1" />
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(bid.amount)}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true, locale: ptBR })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Actions */}
                  <Separator />
                  <div className="flex gap-2">
                    {active && mode === 'participate' && (
                      <Dialog open={isBidDialogOpen && selectedAuction?.id === auction.id} onOpenChange={(open) => {
                        setIsBidDialogOpen(open);
                        if (open) setSelectedAuction(auction);
                      }}>
                        <DialogTrigger asChild>
                          <Button className="bg-gradient-to-r from-primary to-brand-secondary">
                            <Gavel className="h-3 w-3 mr-1" />
                            Dar Lance
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Dar Lance - {auction.property_title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Alert>
                              <DollarSign className="h-4 w-4" />
                              <AlertDescription>
                                Lance mínimo: <strong>{formatCurrency(auction.current_highest_bid + auction.minimum_increment)}</strong>
                              </AlertDescription>
                            </Alert>
                            
                            <div>
                              <Label htmlFor="bidder_name">Seu Nome *</Label>
                              <Input
                                id="bidder_name"
                                value={bidForm.bidder_name}
                                onChange={(e) => setBidForm({...bidForm, bidder_name: e.target.value})}
                                placeholder="João Silva"
                              />
                            </div>
                            <div>
                              <Label htmlFor="bidder_email">Email</Label>
                              <Input
                                id="bidder_email"
                                type="email"
                                value={bidForm.bidder_email}
                                onChange={(e) => setBidForm({...bidForm, bidder_email: e.target.value})}
                                placeholder="joao@email.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor="bidder_phone">Telefone</Label>
                              <Input
                                id="bidder_phone"
                                value={bidForm.bidder_phone}
                                onChange={(e) => setBidForm({...bidForm, bidder_phone: e.target.value})}
                                placeholder="(11) 99999-9999"
                              />
                            </div>
                            <div>
                              <Label htmlFor="bid_amount">Valor do Lance *</Label>
                              <Input
                                id="bid_amount"
                                value={bidForm.bid_amount}
                                onChange={(e) => setBidForm({...bidForm, bid_amount: e.target.value})}
                                placeholder={formatCurrency(auction.current_highest_bid + auction.minimum_increment)}
                              />
                            </div>
                            <Button onClick={placeBid} disabled={loading} className="w-full">
                              Confirmar Lance
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <Clock className="h-3 w-3 mr-1" />
                      Ver Histórico
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}