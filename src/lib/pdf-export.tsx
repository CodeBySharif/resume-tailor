"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import type { Resume, ResumeHeader } from "./resume-schema";
import { formatDateRange } from "./date-utils";
import { formatDisplayName, formatDisplayTitle } from "./format-name";
import {
  getCoverLetterGreeting,
  getHeaderContactLine,
  stripCoverLetterSignature,
} from "./resume-header";
import { RESUME_SPACE_PT } from "./resume-spacing";
import { normalizePrintableText } from "./text-normalize";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

function sanitizePdfText(value: string): string {
  return normalizePrintableText(value);
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    color: "#111111",
  },
  body: {
    lineHeight: 1.25,
    fontSize: 10,
  },
  headerBlock: {
    paddingBottom: 16,
    marginBottom: 12,
    textAlign: "center",
    lineHeight: 1,
  },
  headerRow: {
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    lineHeight: 1,
    textAlign: "center",
  },
  title: {
    fontSize: 10,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    color: "#6b7280",
    lineHeight: 1,
    textAlign: "center",
  },
  contact: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    paddingBottom: 1,
    marginBottom: 0,
    marginTop: 0,
    lineHeight: 1,
  },
  resumeSection: {
    marginBottom: RESUME_SPACE_PT.afterSection,
  },
  sectionContent: {
    paddingTop: RESUME_SPACE_PT.afterHeader,
  },
  resumeEntry: {
    marginTop: RESUME_SPACE_PT.betweenContent,
  },
  contentSpaced: {
    marginTop: RESUME_SPACE_PT.betweenContent,
  },
  summary: {
    marginTop: 0,
    marginBottom: 0,
    textAlign: "justify",
    fontSize: 10,
    lineHeight: 1.25,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 0,
    marginTop: 0,
  },
  entryTitle: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 10,
    lineHeight: 1.2,
  },
  entrySubtitle: {
    fontSize: 10,
    marginBottom: 0,
    lineHeight: 1.25,
  },
  entryDate: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.2,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 0,
    paddingLeft: 8,
    marginTop: 0,
  },
  bulletDot: {
    width: 8,
    fontSize: 10,
    lineHeight: 1.25,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.25,
  },
  skills: {
    fontSize: 10,
    marginTop: 0,
    marginBottom: 0,
    lineHeight: 1.25,
  },
  projectDesc: {
    fontSize: 10,
    marginBottom: 0,
    lineHeight: 1.25,
  },
  projectTech: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 0,
    lineHeight: 1.25,
  },
  letterSenderName: {
    fontSize: 11,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    marginBottom: 2,
  },
  letterSenderLine: {
    fontSize: 10,
    marginBottom: 2,
    lineHeight: 1.5,
    color: "#374151",
  },
  letterDate: {
    fontSize: 10,
    marginTop: 8,
    marginBottom: 20,
    color: "#374151",
  },
  letterRecipient: {
    fontSize: 10,
    marginBottom: 2,
    lineHeight: 1.5,
    color: "#374151",
  },
  letterSubject: {
    fontSize: 10,
    marginTop: 16,
    marginBottom: 16,
    color: "#374151",
  },
  letterGreeting: {
    fontSize: 10,
    marginBottom: 12,
    color: "#111111",
  },
  letterBody: {
    fontSize: 10,
    marginBottom: 10,
    textAlign: "justify",
    lineHeight: 1.65,
    color: "#111111",
  },
  letterSignOff: {
    fontSize: 10,
    marginTop: 20,
    color: "#111111",
  },
  letterSignature: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    color: "#111111",
  },
});

function PdfResumeHeaderBlock({ header }: { header: ResumeHeader }) {
  const contactLine = getHeaderContactLine(header);
  const name = formatDisplayName(header.name);
  const title = formatDisplayTitle(header.title);

  return (
    <View style={styles.headerBlock}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{sanitizePdfText(name)}</Text>
      </View>
      {title ? (
        <View style={styles.headerRow}>
          <Text style={styles.title}>{sanitizePdfText(title)}</Text>
        </View>
      ) : null}
      {contactLine ? (
        <View>
          <Text style={styles.contact}>{sanitizePdfText(contactLine)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{sanitizePdfText(title)}</Text>;
}

function PdfResumeSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.resumeSection}>
      <SectionTitle title={title} />
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export function ResumePDFDocument({ resume }: { resume: Resume }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <PdfResumeHeaderBlock header={resume.header} />

        <View style={styles.body}>
        {resume.summary ? (
          <PdfResumeSection title="Professional Summary">
            <Text style={styles.summary}>{sanitizePdfText(resume.summary)}</Text>
          </PdfResumeSection>
        ) : null}

        {resume.experience.length > 0 ? (
          <PdfResumeSection title="Experience">
            {resume.experience.map((exp, index) => (
              <View
                key={exp.id}
                style={index > 0 ? styles.resumeEntry : undefined}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{sanitizePdfText(exp.role)}</Text>
                  <Text style={styles.entryDate}>
                    {sanitizePdfText(formatDateRange(exp.startDate, exp.endDate))}
                  </Text>
                </View>
                <Text style={[styles.entrySubtitle, styles.contentSpaced]}>
                  {sanitizePdfText(
                    `${exp.company}${exp.location ? `, ${exp.location}` : ""}`
                  )}
                </Text>
                <View style={styles.contentSpaced}>
                {exp.bullets.filter(Boolean).map((bullet, i) => (
                  <View key={i} style={styles.bullet}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{sanitizePdfText(bullet)}</Text>
                  </View>
                ))}
                </View>
              </View>
            ))}
          </PdfResumeSection>
        ) : null}

        {resume.projects.length > 0 ? (
          <PdfResumeSection title="Projects">
            {resume.projects.map((proj, index) => (
              <View
                key={proj.id}
                style={index > 0 ? styles.resumeEntry : undefined}
              >
                <Text style={styles.entryTitle}>{sanitizePdfText(proj.name)}</Text>
                <Text style={[styles.projectDesc, styles.contentSpaced]}>
                  {sanitizePdfText(proj.description)}
                </Text>
                {proj.technologies && proj.technologies.length > 0 ? (
                  <Text style={[styles.projectTech, styles.contentSpaced]}>
                    {sanitizePdfText(proj.technologies.join(", "))}
                  </Text>
                ) : null}
              </View>
            ))}
          </PdfResumeSection>
        ) : null}

        {resume.education.length > 0 ? (
          <PdfResumeSection title="Education">
            {resume.education.map((edu, index) => (
              <View
                key={edu.id}
                style={index > 0 ? styles.resumeEntry : undefined}
              >
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {sanitizePdfText(
                      `${edu.degree}${edu.field ? ` in ${edu.field}` : ""}`
                    )}
                  </Text>
                  <Text style={styles.entryDate}>
                    {sanitizePdfText(formatDateRange(edu.startDate, edu.endDate))}
                  </Text>
                </View>
                <Text style={[styles.entrySubtitle, styles.contentSpaced]}>
                  {sanitizePdfText(
                    `${edu.institution}${edu.gpa ? ` | GPA: ${edu.gpa}` : ""}`
                  )}
                </Text>
              </View>
            ))}
          </PdfResumeSection>
        ) : null}

        {resume.skills.length > 0 ? (
          <PdfResumeSection title="Skills">
            <Text style={styles.skills}>{sanitizePdfText(resume.skills.join(" • "))}</Text>
          </PdfResumeSection>
        ) : null}

        {resume.languages.length > 0 ? (
          <PdfResumeSection title="Languages">
            <Text style={styles.skills}>{sanitizePdfText(resume.languages.join(" • "))}</Text>
          </PdfResumeSection>
        ) : null}

        {resume.customSections.map((section) => (
          <PdfResumeSection key={section.id} title={section.title}>
            <Text style={styles.summary}>{sanitizePdfText(section.content)}</Text>
          </PdfResumeSection>
        ))}
        </View>
      </Page>
    </Document>
  );
}

export function CoverLetterPDFDocument({
  coverLetter,
  header,
  company,
  role,
}: {
  coverLetter: string;
  header: ResumeHeader;
  company: string;
  role: string;
}) {
  const body = stripCoverLetterSignature(coverLetter);
  const paragraphs = body.split(/\n\n+/).filter(Boolean);
  const displayName = formatDisplayName(header.name);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PdfResumeHeaderBlock header={header} />

        <Text style={styles.letterDate}>{today}</Text>

        <Text style={styles.letterRecipient}>Hiring Manager</Text>
        <Text style={styles.letterRecipient}>{sanitizePdfText(company)}</Text>

        <Text style={styles.letterSubject}>{sanitizePdfText(`Re: ${role}`)}</Text>

        <Text style={styles.letterGreeting}>{getCoverLetterGreeting()}</Text>

        {paragraphs.map((para, i) => (
          <Text key={i} style={styles.letterBody}>
            {sanitizePdfText(para)}
          </Text>
        ))}

        <Text style={styles.letterSignOff}>Sincerely,</Text>
        <Text style={styles.letterSignature}>{sanitizePdfText(displayName)}</Text>
      </Page>
    </Document>
  );
}
