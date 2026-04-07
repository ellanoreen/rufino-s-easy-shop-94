import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/context/ProductContext';
import heroImage from '@/assets/hero-living-room.jpg';

const Index = () => {
  const { products } = useProducts();
  const featured = products.filter(p => p.featured);

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
      <img src={heroImage} alt="Beautiful modern living room" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 to-foreground/20" />
      <div className="relative flex h-full items-center">
        <div className="container mx-auto px-4">
          <div className="max-w-lg animate-fade-in">
            <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
              Furniture That Feels Like Home
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Curated pieces designed for comfort, crafted for beauty.
            </p>
            <Link to="/shop">
              <Button size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
                Browse Collection <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* Featured */}
    <section className="container mx-auto px-4 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">Featured Pieces</h2>
          <p className="mt-1 text-muted-foreground">Our most loved selections</p>
        </div>
        <Link to="/shop">
          <Button variant="ghost" className="text-accent hover:text-accent/80">
            View All <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="bg-primary py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-display text-3xl font-bold text-primary-foreground">Ready to Transform Your Space?</h2>
        <p className="mx-auto mt-3 max-w-md text-primary-foreground/70">
          Explore our full catalog and find the perfect pieces for every room.
        </p>
        <Link to="/shop">
          <Button size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
            Shop Now
          </Button>
        </Link>
      </div>
    </section>
  </div>
  );
};

export default Index;
