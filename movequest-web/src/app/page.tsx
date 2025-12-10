import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Image
              src="/icons/movequest-logo.svg"
              alt="MoveQuest Logo"
              width={512}
              height={512}
              className="mx-auto fill-white"
              priority
            />
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            Move More, Learn Better
          </h1>

          <p className="text-xl sm:text-2xl text-muted mb-8 max-w-2xl mx-auto">
            MoveQuest transforms physical activity into an engaging educational experience.
            Motivate students through gamification while promoting healthier lifestyles.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition-colors">
              Go to Dashboard
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 border border-accent text-accent hover:bg-accent/10 font-semibold rounded-lg transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose MoveQuest?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background p-8 rounded-lg border border-border">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold mb-3">Gamified Learning</h3>
              <p className="text-muted">
                Turn physical activity into an exciting game with challenges,
                leaderboards, and rewards that keep students engaged.
              </p>
            </div>

            <div className="bg-background p-8 rounded-lg border border-border">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Real-Time Analytics</h3>
              <p className="text-muted">
                Teachers get instant insights into student activity levels,
                progress tracking, and engagement metrics.
              </p>
            </div>

            <div className="bg-background p-8 rounded-lg border border-border">
              <div className="text-4xl mb-4">⌚</div>
              <h3 className="text-xl font-semibold mb-3">Wearable Integration</h3>
              <p className="text-muted">
                Seamlessly connect with popular fitness wearables to track
                real-world movement and activity.
              </p>
            </div>

            <div className="bg-background p-8 rounded-lg border border-border">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-3">Achievement System</h3>
              <p className="text-muted">
                Unlock badges, earn points, and climb the ranks. Recognition
                motivates students to stay active.
              </p>
            </div>

            <div className="bg-background p-8 rounded-lg border border-border">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-3">Social Competition</h3>
              <p className="text-muted">
                Friendly competition with classmates creates a supportive
                community focused on wellness.
              </p>
            </div>

            <div className="bg-background p-8 rounded-lg border border-border">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3">Custom Challenges</h3>
              <p className="text-muted">
                Teachers can create class-specific challenges aligned with
                curriculum goals and fitness objectives.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
        
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect Your Wearable</h3>
                <p className="text-muted">
                  Link your fitness tracker or smartwatch to start syncing your
                  daily activity automatically.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Join Your Class</h3>
                <p className="text-muted">
                  Students join their teacher&apos;s class and start competing in 
                  challenges with their peers.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Complete Challenges</h3>
                <p className="text-muted">
                  Meet daily step goals, participate in special events, and unlock 
                  achievements through consistent activity.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="shrink-0 w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
                <p className="text-muted">
                  Gain points, climb leaderboards, and unlock exclusive rewards 
                  as you stay active.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted mb-8">
            Join MoveQuest today and transform how students stay active and engaged.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-in"
              className="px-8 py-4 bg-accent hover:bg-accent/90 text-white font-semibold rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 border border-accent text-accent hover:bg-accent/10 font-semibold rounded-lg transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-background border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted">
                <li><Link href="/features" className="hover:text-foreground">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted">
                <li><Link href="/about" className="hover:text-foreground">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-muted">
                <li><Link href="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted">
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="/cookies" className="hover:text-foreground">Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 text-center text-muted">
            <p>&copy; 2025 MoveQuest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
