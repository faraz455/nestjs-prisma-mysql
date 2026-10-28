import { Prisma } from '../../../src/generated/prisma/client';

export const articleData: Prisma.ArticleUncheckedCreateInput[] = [
  {
    body: 'This is the body of the first article. It contains detailed information and insights on the topic discussed.',
    title: 'The Importance of Learning Code',
    description:
      'An in-depth look at why coding skills are essential in the modern world.',
    published: true,
  },
  {
    body: 'This is the body of the second article. It provides a comprehensive guide on how to start with React.',
    title: 'Getting Started with React',
    description: "A beginner's guide to building applications with React.",
    published: true,
  },
  {
    body: 'This article explores the fundamentals of cloud computing and its benefits for businesses.',
    title: 'Cloud Computing 101',
    description: 'Understanding the basics of cloud computing.',
    published: false,
  },
  {
    body: 'An extensive review of the latest trends in web development for the year 2024.',
    title: 'Web Development Trends 2024',
    description: 'What to expect and prepare for in web development this year.',
    published: true,
  },
  {
    body: 'Tips and tricks for optimizing database performance in high-traffic applications.',
    title: 'Database Optimization Techniques',
    description: 'Improving database performance for large-scale applications.',
    published: true,
  },
  {
    body: 'A deep dive into the principles of clean code and why it matters for software development.',
    title: 'Clean Code: Best Practices',
    description: 'How to write maintainable and scalable code.',
    published: false,
  },
  {
    body: 'An overview of the new features in the latest version of TypeScript and how they can enhance your development workflow.',
    title: "What's New in TypeScript",
    description: 'Exploring the new features of TypeScript.',
    published: true,
  },
  {
    body: 'This article discusses the importance of cybersecurity and measures to protect against common threats.',
    title: 'Cybersecurity Essentials',
    description: 'Protecting your digital assets in the modern age.',
    published: true,
  },
  {
    body: 'An introduction to microservices architecture and its benefits for building scalable applications.',
    title: 'Microservices Architecture Explained',
    description: 'A comprehensive guide to microservices.',
    published: false,
  },
  {
    body: 'A guide to understanding and implementing RESTful APIs in your web applications.',
    title: 'Building RESTful APIs',
    description: 'Designing and implementing RESTful APIs.',
    published: true,
  },
];
