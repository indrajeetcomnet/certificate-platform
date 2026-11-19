import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Sparkles,
  Palette,
  Eye,
  ArrowRight,
  Shield,
  Trophy,
  GraduationCap,
  Gamepad2,
  CheckCircle2,
  Check,
  Zap,
  Briefcase
} from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

export const CERTIFICATE_TEMPLATES = [
  {
    id: 'imperial-gold',
    name: 'Imperial Gold Championship',
    category: 'SPORTS',
    categoryLabel: 'Sports & Athletics',
    badge: '🏆 Gold Champion',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    accentColor: '#B45309',
    bgPreview: 'linear-gradient(135deg, #FFFDF5 0%, #FEF9C3 50%, #FDE68A 100%)',
    borderPreview: 'border-amber-500',
    desc: 'Classic double-bordered parchment diploma with golden seals. Best for 1st Place Champions and Grand Finals.',
    templateData: {
      orientation: 'landscape',
      bgType: 'gradient',
      bgClass: '#FFFDF5',
      bgGradient: 'linear-gradient(135deg, #FFFDF5 0%, #FEF9C3 50%, #FDE68A 100%)',
      bgPattern: 'none',
      borderStyle: 'double-gold',
      borderColor: '#B45309',
      boardTheme: 'gold',
      title: 'National Athletics Championship 2026',
      description: 'For exemplary competitive excellence, athletic discipline, and securing 1st Place Gold Medal in the National Athletics Championship 2026.',
      elements: [
        {
          id: 'inst-logo',
          type: 'seal',
          x: 561,
          y: 105,
          sealType: 'crest',
          label: 'OFFICIAL ACCREDITATION',
          color: '#B45309',
          size: 52,
        },
        {
          id: 'inst-title',
          type: 'text',
          x: 561,
          y: 160,
          text: 'ATHLOS SPORTS FEDERATION',
          fontFamily: 'cinzel',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#92400E',
          letterSpacing: '0.15em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'cert-title',
          type: 'text',
          x: 561,
          y: 220,
          text: 'CERTIFICATE OF ACHIEVEMENT',
          fontFamily: 'cinzel',
          fontSize: 32,
          fontWeight: '900',
          color: '#1C1917',
          letterSpacing: '0.08em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'award-subtitle',
          type: 'text',
          x: 561,
          y: 285,
          text: 'THIS OFFICIAL CREDENTIAL IS PROUDLY CONFERRED UPON',
          fontFamily: 'inter',
          fontSize: 11,
          fontWeight: '600',
          color: '#78716C',
          letterSpacing: '0.12em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'recipient-name',
          type: 'text',
          x: 561,
          y: 375,
          text: '{{recipient_name}}',
          sampleText: 'Indrajeet Patil',
          fontFamily: 'playfair',
          fontSize: 44,
          fontWeight: 'bold',
          color: '#B45309',
          textAlign: 'center',
          underline: true,
        },
        {
          id: 'citation-body',
          type: 'text',
          x: 561,
          y: 470,
          text: 'For exemplary competitive excellence, athletic discipline, and securing 1st Place Gold Medal in the National Athletics Championship 2026.',
          fontFamily: 'inter',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#44403C',
          textAlign: 'center',
          maxWidth: 720,
          lineHeight: 1.6,
        },
        {
          id: 'date-text',
          type: 'text',
          x: 230,
          y: 625,
          text: 'Date: {{issue_date}}',
          sampleText: 'Date: 20 November 2026',
          fontFamily: 'inter',
          fontSize: 12,
          fontWeight: '500',
          color: '#57534E',
          textAlign: 'center',
        },
        {
          id: 'gold-seal',
          type: 'seal',
          x: 561,
          y: 615,
          sealType: 'gold-medal',
          label: '#1 RANK GOLD',
          color: '#D97706',
          size: 68,
        },
        {
          id: 'signer-title',
          type: 'signature',
          x: 890,
          y: 615,
          signerName: 'Alexander Vance',
          signerTitle: 'Federation Director & Chief Official',
          fontFamily: 'signature',
          fontSize: 26,
          color: '#1C1917',
          textAlign: 'center',
        },
        {
          id: 'unique-number-pill',
          type: 'unique-code',
          x: 561,
          y: 725,
          code: '{{unique_code}}',
          sampleCode: 'GC-2026-ATH-GOLD-01',
          fontSize: 11,
          fontFamily: 'mono',
          color: '#1C1917',
        },
      ],
    },
  },
  {
    id: 'royal-silver',
    name: 'Royal Silver Distinguished Finalist',
    category: 'SPORTS',
    categoryLabel: 'Sports & Athletics',
    badge: '🥈 Silver Finalist',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    accentColor: '#475569',
    bgPreview: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #E2E8F0 100%)',
    borderPreview: 'border-slate-400',
    desc: 'Refined silver filigree and polished slate borders. Tailored for 2nd Place Finalists and tournament runners-up.',
    templateData: {
      orientation: 'landscape',
      bgType: 'gradient',
      bgClass: '#FAF9F5',
      bgGradient: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 50%, #E2E8F0 100%)',
      bgPattern: 'none',
      borderStyle: 'double-silver',
      borderColor: '#64748B',
      boardTheme: 'silver',
      title: 'Regional Track & Field Meet 2026',
      description: 'In recognition of securing 2nd Place Silver Medal and demonstrating exceptional competitive perseverance across all final heats.',
      elements: [
        {
          id: 'inst-title',
          type: 'text',
          x: 561,
          y: 130,
          text: 'ATHLOS ATHLETIC FEDERATION',
          fontFamily: 'cinzel',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#475569',
          letterSpacing: '0.15em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'cert-title',
          type: 'text',
          x: 561,
          y: 200,
          text: 'DISTINGUISHED ATHLETE AWARD',
          fontFamily: 'cinzel',
          fontSize: 32,
          fontWeight: '900',
          color: '#0F172A',
          letterSpacing: '0.08em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'award-subtitle',
          type: 'text',
          x: 561,
          y: 275,
          text: 'PROUDLY CONFERRED UPON',
          fontFamily: 'inter',
          fontSize: 11,
          fontWeight: '600',
          color: '#64748B',
          letterSpacing: '0.12em',
          textAlign: 'center',
        },
        {
          id: 'recipient-name',
          type: 'text',
          x: 561,
          y: 365,
          text: '{{recipient_name}}',
          sampleText: 'Sarah Chen',
          fontFamily: 'playfair',
          fontSize: 44,
          fontWeight: 'bold',
          color: '#334155',
          textAlign: 'center',
          underline: true,
        },
        {
          id: 'citation-body',
          type: 'text',
          x: 561,
          y: 460,
          text: 'In recognition of securing 2nd Place Silver Medal and demonstrating championship tenacity across all tournament heats.',
          fontFamily: 'inter',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#334155',
          textAlign: 'center',
          maxWidth: 720,
          lineHeight: 1.6,
        },
        {
          id: 'date-text',
          type: 'text',
          x: 230,
          y: 625,
          text: 'Date: {{issue_date}}',
          sampleText: 'Date: 20 November 2026',
          fontFamily: 'inter',
          fontSize: 12,
          color: '#64748B',
          textAlign: 'center',
        },
        {
          id: 'silver-seal',
          type: 'seal',
          x: 561,
          y: 615,
          sealType: 'silver-medal',
          label: '#2 RANK SILVER',
          color: '#64748B',
          size: 66,
        },
        {
          id: 'signer-title',
          type: 'signature',
          x: 890,
          y: 615,
          signerName: 'Sarah Jenkins',
          signerTitle: 'President of Officials',
          fontFamily: 'alex-brush',
          fontSize: 26,
          color: '#0F172A',
          textAlign: 'center',
        },
        {
          id: 'unique-number-pill',
          type: 'unique-code',
          x: 561,
          y: 725,
          code: '{{unique_code}}',
          sampleCode: 'GC-2026-ATH-SILV-02',
          fontSize: 11,
          fontFamily: 'mono',
          color: '#0F172A',
        },
      ],
    },
  },
  {
    id: 'emerald-fellow',
    name: 'Emerald Academic & Debate Honors',
    category: 'ACADEMICS',
    categoryLabel: 'Academics & Education',
    badge: '🎓 Academic Honor',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    accentColor: '#047857',
    bgPreview: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #D1FAE5 100%)',
    borderPreview: 'border-emerald-600',
    desc: 'Deep forest green with classical crest accents. Ideal for science olympiads, debate championships, and hackathons.',
    templateData: {
      orientation: 'landscape',
      bgType: 'gradient',
      bgClass: '#F8FAF7',
      bgGradient: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #D1FAE5 100%)',
      bgPattern: 'none',
      borderStyle: 'emerald-crest',
      borderColor: '#047857',
      boardTheme: 'emerald',
      title: 'National Parliamentary Debate Cup 2026',
      description: 'Conferred in recognition of intellectual leadership, persuasive rhetoric, and outstanding achievement in the National Parliamentary Debate Cup 2026.',
      elements: [
        {
          id: 'inst-logo',
          type: 'seal',
          x: 561,
          y: 105,
          sealType: 'academic-shield',
          label: 'SCHOLASTIC MERIT',
          color: '#047857',
          size: 52,
        },
        {
          id: 'inst-title',
          type: 'text',
          x: 561,
          y: 160,
          text: 'NATIONAL COLLEGIATE DEBATE UNION',
          fontFamily: 'cinzel',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#065F46',
          letterSpacing: '0.15em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'cert-title',
          type: 'text',
          x: 561,
          y: 220,
          text: 'HONORARY FELLOWSHIP & MERIT',
          fontFamily: 'cinzel',
          fontSize: 32,
          fontWeight: '900',
          color: '#064E3B',
          letterSpacing: '0.08em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'award-subtitle',
          type: 'text',
          x: 561,
          y: 285,
          text: 'FOR SPECIAL MERIT & SCHOLASTIC DISTINCTION',
          fontFamily: 'inter',
          fontSize: 11,
          fontWeight: '600',
          color: '#65A30D',
          letterSpacing: '0.12em',
          textAlign: 'center',
        },
        {
          id: 'recipient-name',
          type: 'text',
          x: 561,
          y: 375,
          text: '{{recipient_name}}',
          sampleText: 'Alex Vance',
          fontFamily: 'playfair',
          fontSize: 44,
          fontWeight: 'bold',
          color: '#047857',
          textAlign: 'center',
          underline: true,
        },
        {
          id: 'citation-body',
          type: 'text',
          x: 561,
          y: 470,
          text: 'Conferred in recognition of leadership, persuasive argumentation, and distinction in the official inter-collegiate tournament series.',
          fontFamily: 'inter',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#1F2937',
          textAlign: 'center',
          maxWidth: 720,
          lineHeight: 1.6,
        },
        {
          id: 'date-text',
          type: 'text',
          x: 230,
          y: 625,
          text: 'Date: {{issue_date}}',
          sampleText: 'Date: 20 November 2026',
          fontFamily: 'inter',
          fontSize: 12,
          color: '#047857',
          textAlign: 'center',
        },
        {
          id: 'emerald-seal',
          type: 'seal',
          x: 561,
          y: 615,
          sealType: 'academic-shield',
          label: 'CERTIFIED HONORS',
          color: '#047857',
          size: 68,
        },
        {
          id: 'signer-title',
          type: 'signature',
          x: 890,
          y: 615,
          signerName: 'Dr. Marcus Thorne',
          signerTitle: 'Dean of Academic Adjudication',
          fontFamily: 'dancing',
          fontSize: 26,
          color: '#064E3B',
          textAlign: 'center',
        },
        {
          id: 'unique-number-pill',
          type: 'unique-code',
          x: 561,
          y: 725,
          code: '{{unique_code}}',
          sampleCode: 'NCDU-2026-HON-009',
          fontSize: 11,
          fontFamily: 'mono',
          color: '#064E3B',
        },
      ],
    },
  },
  {
    id: 'cyber-esports',
    name: 'Midnight Cyber Esports Trophy',
    category: 'ESPORTS',
    categoryLabel: 'Esports & Gaming',
    badge: '🎮 Victory Royale',
    badgeColor: 'bg-zinc-800 text-amber-400 border-zinc-700',
    accentColor: '#F59E0B',
    bgPreview: 'linear-gradient(135deg, #09090B 0%, #18181B 50%, #27272A 100%)',
    borderPreview: 'border-amber-400',
    desc: 'High-contrast dark-mode esports championship certificate with neon gold accents. Built for LAN events and competitive scrims.',
    templateData: {
      orientation: 'landscape',
      bgType: 'gradient',
      bgClass: '#09090B',
      bgGradient: 'linear-gradient(135deg, #09090B 0%, #18181B 50%, #27272A 100%)',
      bgPattern: 'none',
      borderStyle: 'double-gold',
      borderColor: '#F59E0B',
      boardTheme: 'dark',
      title: 'Valorant Champions Invitational 2026',
      description: 'Awarded to the Grand Champions for supreme tactical execution and securing 1st Place in the Valorant Champions Invitational 2026.',
      elements: [
        {
          id: 'inst-logo',
          type: 'seal',
          x: 561,
          y: 105,
          sealType: 'gold-medal',
          label: 'ESPORTS PREMIER',
          color: '#F59E0B',
          size: 52,
        },
        {
          id: 'inst-title',
          type: 'text',
          x: 561,
          y: 160,
          text: 'ARENA ESPORTS LEAGUE',
          fontFamily: 'cinzel',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#F59E0B',
          letterSpacing: '0.18em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'cert-title',
          type: 'text',
          x: 561,
          y: 220,
          text: 'CHAMPIONSHIP TROPHY CERTIFICATE',
          fontFamily: 'cinzel',
          fontSize: 30,
          fontWeight: '900',
          color: '#FFFFFF',
          letterSpacing: '0.08em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'award-subtitle',
          type: 'text',
          x: 561,
          y: 285,
          text: 'PRESENTED TO THE GRAND CHAMPION SQUAD',
          fontFamily: 'inter',
          fontSize: 11,
          fontWeight: '600',
          color: '#A1A1AA',
          letterSpacing: '0.14em',
          textAlign: 'center',
        },
        {
          id: 'recipient-name',
          type: 'text',
          x: 561,
          y: 375,
          text: '{{recipient_name}}',
          sampleText: 'Red Hawks Squad',
          fontFamily: 'cinzel',
          fontSize: 42,
          fontWeight: 'bold',
          color: '#FBBF24',
          textAlign: 'center',
          underline: true,
        },
        {
          id: 'citation-body',
          type: 'text',
          x: 561,
          y: 470,
          text: 'For flawless tactical mastery, map control, and emerging as the undefeated Champions in the Arena Esports Premier League 2026.',
          fontFamily: 'inter',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#D4D4D8',
          textAlign: 'center',
          maxWidth: 720,
          lineHeight: 1.6,
        },
        {
          id: 'date-text',
          type: 'text',
          x: 230,
          y: 625,
          text: 'Date: {{issue_date}}',
          sampleText: 'Date: 20 November 2026',
          fontFamily: 'mono',
          fontSize: 12,
          color: '#A1A1AA',
          textAlign: 'center',
        },
        {
          id: 'cyber-seal',
          type: 'seal',
          x: 561,
          y: 615,
          sealType: 'gold-medal',
          label: 'VICTORY ROYALE',
          color: '#F59E0B',
          size: 68,
        },
        {
          id: 'signer-title',
          type: 'signature',
          x: 890,
          y: 615,
          signerName: 'Kaelen Cross',
          signerTitle: 'Esports League Commissioner',
          fontFamily: 'signature',
          fontSize: 26,
          color: '#F4F4F5',
          textAlign: 'center',
        },
        {
          id: 'unique-number-pill',
          type: 'unique-code',
          x: 561,
          y: 725,
          code: '{{unique_code}}',
          sampleCode: 'VAL-2026-CHAMP-001',
          fontSize: 11,
          fontFamily: 'mono',
          color: '#F59E0B',
        },
      ],
    },
  },
  {
    id: 'clean-minimal',
    name: 'Atelier Minimalist Fine Arts & Corporate',
    category: 'ARTS',
    categoryLabel: 'Arts & Corporate',
    badge: '🎨 Atelier Merit',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
    accentColor: '#44403C',
    bgPreview: 'linear-gradient(135deg, #FAFAF9 0%, #F5F5F4 50%, #E7E5E4 100%)',
    borderPreview: 'border-stone-500',
    desc: 'Clean Scandinavian gallery aesthetics with crisp modern typography. Best for art showcases, corporate pitch fests, and film awards.',
    templateData: {
      orientation: 'landscape',
      bgType: 'gradient',
      bgClass: '#FAFAF9',
      bgGradient: 'linear-gradient(135deg, #FAFAF9 0%, #F5F5F4 50%, #E7E5E4 100%)',
      bgPattern: 'none',
      borderStyle: 'clean-minimal',
      borderColor: '#44403C',
      boardTheme: 'minimal',
      title: 'International Design & Short Film Showcase 2026',
      description: 'Awarded for extraordinary creative vision, conceptual distinction, and technical precision in the International Design Showcase 2026.',
      elements: [
        {
          id: 'inst-title',
          type: 'text',
          x: 561,
          y: 140,
          text: 'CONTEMPORARY CREATIVE FEDERATION',
          fontFamily: 'inter',
          fontSize: 12,
          fontWeight: 'bold',
          color: '#57534E',
          letterSpacing: '0.22em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'cert-title',
          type: 'text',
          x: 561,
          y: 210,
          text: 'CITATION OF CREATIVE MERIT',
          fontFamily: 'playfair',
          fontSize: 34,
          fontWeight: 'bold',
          color: '#1C1917',
          letterSpacing: '0.04em',
          textAlign: 'center',
        },
        {
          id: 'award-subtitle',
          type: 'text',
          x: 561,
          y: 275,
          text: 'CONFERRED WITH HIGHEST ACCLAIM UPON',
          fontFamily: 'inter',
          fontSize: 10,
          fontWeight: '600',
          color: '#78716C',
          letterSpacing: '0.15em',
          textAlign: 'center',
        },
        {
          id: 'recipient-name',
          type: 'text',
          x: 561,
          y: 360,
          text: '{{recipient_name}}',
          sampleText: 'Elena Rostova',
          fontFamily: 'playfair',
          fontSize: 42,
          fontWeight: 'bold',
          color: '#1C1917',
          textAlign: 'center',
          underline: true,
        },
        {
          id: 'citation-body',
          type: 'text',
          x: 561,
          y: 450,
          text: 'In recognition of outstanding artistic merit, conceptual narrative, and visual excellence exhibited at the 2026 Annual Fine Arts Invitational.',
          fontFamily: 'inter',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#44403C',
          textAlign: 'center',
          maxWidth: 680,
          lineHeight: 1.6,
        },
        {
          id: 'date-text',
          type: 'text',
          x: 230,
          y: 625,
          text: 'Date: {{issue_date}}',
          sampleText: 'Date: 20 November 2026',
          fontFamily: 'inter',
          fontSize: 11,
          color: '#78716C',
          textAlign: 'center',
        },
        {
          id: 'minimal-seal',
          type: 'seal',
          x: 561,
          y: 615,
          sealType: 'crest',
          label: 'CREATIVE MERIT',
          color: '#44403C',
          size: 60,
        },
        {
          id: 'signer-title',
          type: 'signature',
          x: 890,
          y: 615,
          signerName: 'Vivienne Leclair',
          signerTitle: 'Head Curator & Juror',
          fontFamily: 'alex-brush',
          fontSize: 26,
          color: '#1C1917',
          textAlign: 'center',
        },
        {
          id: 'unique-number-pill',
          type: 'unique-code',
          x: 561,
          y: 725,
          code: '{{unique_code}}',
          sampleCode: 'ART-2026-MERIT-01',
          fontSize: 11,
          fontFamily: 'mono',
          color: '#44403C',
        },
      ],
    },
  },
  {
    id: 'official-accreditation',
    name: 'High-Security Guilloché Accreditation',
    category: 'CORPORATE',
    categoryLabel: 'Official Accreditations',
    badge: '🛡️ Cryptographic',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    accentColor: '#1E3A8A',
    bgPreview: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #DBEAFE 100%)',
    borderPreview: 'border-blue-700',
    desc: 'Official institutional license with cryptographic verification ribbons. Best for coach credentials, club licenses, and corporate compliance.',
    templateData: {
      orientation: 'landscape',
      bgType: 'gradient',
      bgClass: '#F8FAFC',
      bgGradient: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #DBEAFE 100%)',
      bgPattern: 'none',
      borderStyle: 'double-gold',
      borderColor: '#1E3A8A',
      boardTheme: 'blue',
      title: 'Institutional Accreditation & License 2026',
      description: 'Officially confirms that the recipient has satisfied all federation compliance criteria, ethical standards, and tournament governance protocols.',
      elements: [
        {
          id: 'inst-logo',
          type: 'seal',
          x: 561,
          y: 105,
          sealType: 'academic-shield',
          label: 'FEDERATION SEAL',
          color: '#1E3A8A',
          size: 52,
        },
        {
          id: 'inst-title',
          type: 'text',
          x: 561,
          y: 160,
          text: 'INTERNATIONAL FEDERATION OF SPORTS ACCREDITATION',
          fontFamily: 'cinzel',
          fontSize: 13,
          fontWeight: 'bold',
          color: '#1E3A8A',
          letterSpacing: '0.15em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'cert-title',
          type: 'text',
          x: 561,
          y: 220,
          text: 'CERTIFICATE OF OFFICIAL ACCREDITATION',
          fontFamily: 'cinzel',
          fontSize: 28,
          fontWeight: '900',
          color: '#0F172A',
          letterSpacing: '0.06em',
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        {
          id: 'award-subtitle',
          type: 'text',
          x: 561,
          y: 285,
          text: 'THIS IS TO CERTIFY COMPLIANCE & AUTHORIZED ACCREDITATION OF',
          fontFamily: 'inter',
          fontSize: 10,
          fontWeight: '600',
          color: '#64748B',
          letterSpacing: '0.12em',
          textAlign: 'center',
        },
        {
          id: 'recipient-name',
          type: 'text',
          x: 561,
          y: 365,
          text: '{{recipient_name}}',
          sampleText: 'Metro Athletic Club',
          fontFamily: 'playfair',
          fontSize: 40,
          fontWeight: 'bold',
          color: '#1E3A8A',
          textAlign: 'center',
          underline: true,
        },
        {
          id: 'citation-body',
          type: 'text',
          x: 561,
          y: 455,
          text: 'Having fulfilled all statutory guidelines, credential validation standards, and official ethical mandates established by the governing accreditation council.',
          fontFamily: 'inter',
          fontSize: 13,
          fontWeight: 'normal',
          color: '#334155',
          textAlign: 'center',
          maxWidth: 720,
          lineHeight: 1.6,
        },
        {
          id: 'date-text',
          type: 'text',
          x: 230,
          y: 625,
          text: 'Date: {{issue_date}}',
          sampleText: 'Date: 20 November 2026',
          fontFamily: 'inter',
          fontSize: 12,
          color: '#1E3A8A',
          textAlign: 'center',
        },
        {
          id: 'sec-seal',
          type: 'seal',
          x: 561,
          y: 615,
          sealType: 'crest',
          label: 'OFFICIAL LICENSE',
          color: '#1E3A8A',
          size: 66,
        },
        {
          id: 'signer-title',
          type: 'signature',
          x: 890,
          y: 615,
          signerName: 'Sir Reginald Howard',
          signerTitle: 'Chair of Governance & Compliance',
          fontFamily: 'signature',
          fontSize: 26,
          color: '#0F172A',
          textAlign: 'center',
        },
        {
          id: 'unique-number-pill',
          type: 'unique-code',
          x: 561,
          y: 725,
          code: '{{unique_code}}',
          sampleCode: 'IFSA-2026-LIC-8812',
          fontSize: 11,
          fontFamily: 'mono',
          color: '#1E3A8A',
        },
      ],
    },
  },
];

export default function CertificateTemplatesGallery({ onSelectTemplate, className = '' }) {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const filteredTemplates = CERTIFICATE_TEMPLATES.filter((t) => {
    if (selectedFilter === 'ALL') return true;
    return t.category === selectedFilter;
  });

  const handleUseTemplate = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    } else {
      navigate('/certificates/create', { state: { templateData: template.templateData } });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Header & Filter Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Palette className="w-6 h-6 text-amber-600" />
            <span>Ready-Made Certificate Design Templates</span>
          </h2>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Select an official pre-designed certificate template to open directly in the Studio and customize with 1 click.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 text-xs font-bold">
          {[
            { id: 'ALL', label: 'All Designs' },
            { id: 'SPORTS', label: 'Sports & Medals' },
            { id: 'ACADEMICS', label: 'Academics & Debates' },
            { id: 'ESPORTS', label: 'Esports' },
            { id: 'ARTS', label: 'Arts & Cultural' },
            { id: 'CORPORATE', label: 'Accreditation' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                selectedFilter === f.id
                  ? 'bg-stone-900 text-white font-black shadow-xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => {
          return (
            <div
              key={template.id}
              className="bg-white rounded-3xl border border-stone-200/90 hover:border-amber-400 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              {/* Mini Certificate Canvas Visual Representation */}
              <div
                onClick={() => setPreviewTemplate(template)}
                className={`w-full h-44 rounded-2xl border-2 ${template.borderPreview} p-3.5 flex flex-col justify-between cursor-pointer relative overflow-hidden transition-transform group-hover:scale-[1.01]`}
                style={{ background: template.bgPreview }}
              >
                {/* Top Badge & Corner Accents */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${template.badgeColor}`}>
                    {template.badge}
                  </span>
                  <span className="font-mono text-[9px] text-stone-500 font-bold opacity-70">
                    A4 LANDSCAPE
                  </span>
                </div>

                {/* Simulated Certificate Content */}
                <div className="text-center space-y-1 my-auto">
                  <div
                    className="text-xs font-black tracking-widest uppercase truncate px-2"
                    style={{ color: template.accentColor }}
                  >
                    {template.name}
                  </div>
                  <div className="text-[11px] font-bold text-stone-800 italic">
                    Recipient Name
                  </div>
                  <div className="text-[9px] text-stone-500 line-clamp-1 px-4">
                    Official verified award issued by accredited federation
                  </div>
                </div>

                {/* Bottom Simulated Seal & Security Barcode */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-300/40 text-[9px] text-stone-400 font-mono">
                  <span>VERIFIED RECORD</span>
                  <span className="font-bold text-stone-600">★ OFFICIAL SEAL ★</span>
                </div>
              </div>

              {/* Template Metadata & Description */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-stone-900 group-hover:text-amber-800 transition-colors">
                    {template.name}
                  </span>
                </div>
                <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                  {template.desc}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  onClick={() => setPreviewTemplate(template)}
                  className="font-bold text-xs"
                >
                  Preview
                </Button>

                <Button
                  variant="gold"
                  size="sm"
                  icon={Palette}
                  onClick={() => handleUseTemplate(template)}
                  className="font-black shadow-xs hover:scale-105 transition-all text-xs flex-1 justify-center"
                >
                  Use This Template
                </Button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Template In-Depth Preview Modal */}
      {previewTemplate && (
        <Modal
          isOpen={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          title={`Template Preview: ${previewTemplate.name}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewTemplate(null)}
              >
                Close Preview
              </Button>
              <Button
                variant="gold"
                size="sm"
                icon={Palette}
                onClick={() => {
                  const t = previewTemplate;
                  setPreviewTemplate(null);
                  handleUseTemplate(t);
                }}
                className="font-black shadow-md"
              >
                Open in Studio & Customize →
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div
              className={`w-full rounded-2xl border-4 ${previewTemplate.borderPreview} p-8 text-center space-y-5 shadow-md`}
              style={{ background: previewTemplate.bgPreview }}
            >
              <div className="inline-block px-3 py-1 rounded-full bg-white/80 border border-stone-300 text-xs font-black uppercase tracking-widest text-stone-800">
                {previewTemplate.categoryLabel}
              </div>

              <div className="space-y-1">
                <h3
                  className="text-2xl font-black uppercase tracking-wider"
                  style={{ color: previewTemplate.accentColor }}
                >
                  {previewTemplate.templateData.title}
                </h3>
                <p className="text-xs text-stone-500 font-semibold uppercase tracking-widest">
                  This Official Credential is Conferred Upon
                </p>
              </div>

              <div className="py-2">
                <span className="text-3xl font-serif font-black underline text-stone-900">
                  Alex Vance / Indrajeet Patil
                </span>
              </div>

              <p className="text-xs text-stone-600 max-w-lg mx-auto leading-relaxed">
                {previewTemplate.templateData.description}
              </p>

              <div className="pt-6 border-t border-stone-300/60 flex items-center justify-between text-xs text-stone-500">
                <div className="text-left font-mono">
                  <span className="block text-[10px] text-stone-400">CERTIFICATE ID</span>
                  <span className="font-bold text-stone-800">GC-2026-ATH-GOLD-01</span>
                </div>
                <div className="w-14 h-14 rounded-full border-2 border-amber-500 flex items-center justify-center font-black text-amber-600 text-[10px] uppercase shadow-xs">
                  OFFICIAL SEAL
                </div>
                <div className="text-right">
                  <span className="font-serif italic text-stone-800 block text-base">Alexander Vance</span>
                  <span className="text-[10px] text-stone-400 block">Chief Federation Official</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
