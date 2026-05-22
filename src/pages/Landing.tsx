import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Bell,
  Users,
  BookOpen,
  Award,
  Phone,
  MapPin,
  Mail,
  ChevronRight,
  Star,
  Shield,
  Heart,
  Menu,
  X,
  AlertCircle,
} from "lucide-react";

const CLASSES = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Quality Education",
    desc: "Comprehensive curriculum from Class 1 to 8 with experienced faculty dedicated to student growth.",
  },
  {
    icon: Users,
    title: "Experienced Faculty",
    desc: "Our teachers bring years of experience and passion to nurture every child's potential.",
  },
  {
    icon: Award,
    title: "Academic Excellence",
    desc: "Consistent track record of outstanding results and holistic development of students.",
  },
  {
    icon: Heart,
    title: "Caring Environment",
    desc: "A safe, inclusive, and nurturing environment where every child feels valued and supported.",
  },
  {
    icon: Shield,
    title: "Safe Campus",
    desc: "Secure and well-maintained campus ensuring the safety and well-being of all students.",
  },
  {
    icon: Star,
    title: "Co-curricular Activities",
    desc: "Sports, arts, and cultural programs to develop well-rounded personalities.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notices = useQuery(api.notices.list);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">Maa Veena Vaidini</p>
                <p className="text-primary-foreground/70 text-xs">Senior Secondary School</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              {["home", "about", "notices", "contact"].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollTo(item)}
                  className="capitalize hover:text-accent transition-colors font-medium"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/student")}
              >
                Student Login
              </Button>
              <Button
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => navigate("/admin")}
              >
                Admin
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-primary-foreground/20 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-3">
                {["home", "about", "notices", "contact"].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollTo(item)}
                    className="block w-full text-left capitalize py-2 hover:text-accent transition-colors"
                  >
                    {item}
                  </button>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-primary-foreground hover:bg-primary-foreground/10"
                    onClick={() => { navigate("/student"); setMobileMenuOpen(false); }}
                  >
                    Student Login
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }}
                  >
                    Admin
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center text-primary-foreground"
          >
            <Badge className="mb-6 bg-accent text-accent-foreground text-sm px-4 py-1">
              Est. Since Years of Excellence
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Maa Veena Vaidini
              <br />
              <span className="text-accent">Senior Secondary School</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
              Nurturing young minds from Class 1 to 8 with quality education, values, and a
              commitment to excellence in every child's journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8"
                onClick={() => navigate("/student")}
              >
                Student Login
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8"
                onClick={() => scrollTo("about")}
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Classes strip */}
        <div className="relative bg-accent/90 py-3">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-accent-foreground font-semibold text-sm mr-2">Classes:</span>
            {CLASSES.map((c) => (
              <span key={c} className="bg-accent-foreground/20 text-accent-foreground text-xs px-3 py-1 rounded-full font-medium">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Notices Section */}
      <section id="notices" className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Bell className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-bold">Notice Board</h2>
            </div>
            <p className="text-muted-foreground">Stay updated with the latest school announcements</p>
          </motion.div>

          {!notices || notices.length === 0 ? (
            <Card className="max-w-lg mx-auto">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No notices at this time. Check back later.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notices.map((notice, i) => (
                <motion.div
                  key={notice._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`h-full ${notice.important ? "border-destructive/40" : ""}`}>
                    {(notice as { imageUrl?: string }).imageUrl && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={(notice as { imageUrl?: string }).imageUrl}
                          alt={notice.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm leading-tight">{notice.title}</h3>
                        {notice.important && (
                          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-3">{notice.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{notice.date}</span>
                        {notice.important && (
                          <Badge variant="destructive" className="text-xs">Important</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* About / Features Section */}
      <section id="about" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why Choose Our School?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We are committed to providing a holistic education that prepares students for a
              bright future while instilling strong values and character.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery / School Images */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-4">School Life</h2>
            <p className="text-muted-foreground">A glimpse into our vibrant school community</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80",
              "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80",
              "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80",
              "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&q=80",
              "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&q=80",
              "https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80",
            ].map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="aspect-video rounded-xl overflow-hidden"
              >
                <img
                  src={src}
                  alt={`School life ${i + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Login CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-accent" />
            <h2 className="text-3xl font-bold mb-4">Student Portal</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Students can view their academic records, examination results, and personal details
              by logging in with their roll number.
            </p>
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-10"
              onClick={() => navigate("/student")}
            >
              Access Student Portal
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground">Get in touch with us for any queries or information</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: MapPin, label: "Address", value: "Maa Veena Vaidini School, India" },
              { icon: Phone, label: "Phone", value: "+91 XXXXX XXXXX" },
              { icon: Mail, label: "Email", value: "info@mvvschool.edu.in" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="text-center h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="font-semibold mb-1">{item.label}</p>
                    <p className="text-muted-foreground text-sm">{item.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <p className="font-bold text-sm">Maa Veena Vaidini School</p>
                <p className="text-primary-foreground/60 text-xs">Excellence in Education</p>
              </div>
            </div>
            <p className="text-primary-foreground/60 text-xs text-center">
              © {new Date().getFullYear()} Maa Veena Vaidini Senior Secondary School. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm">
              <button onClick={() => navigate("/student")} className="hover:text-accent transition-colors text-xs">
                Student Portal
              </button>
              <button onClick={() => navigate("/admin")} className="hover:text-accent transition-colors text-xs">
                Admin
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}