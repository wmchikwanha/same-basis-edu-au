# SameBasis — inclusive-education evidence workbench (prototype)

SameBasis helps a teacher record the adjustments a learner receives, the evidence that they worked, and what the school's support team needs to see, so a child who is falling behind gets support on the same basis as every other child.

**Status:** prototype on synthetic data only. Not production. The current version is framed for Australia's NCCD (Nationally Consistent Collection of Data on School Students with Disability).

**Live demo:** https://same-basis-edu-au.lovable.app

## What it covers

- Class and student views for teachers
- Adjustment planning and evidence logs
- Equity flags and school-level oversight for administrators
- Family view and help/crisis pathways
- Append-only governance and AI-activity records

## Security note

The Supabase publishable (anon) key in `.env` is intentionally public, as Supabase designs it to be. The service-role key is read from the server environment only and is not in this repository.

## Development

Built with [Lovable](https://lovable.dev) (TanStack Start, React, TypeScript, Supabase).

```sh
git clone https://github.com/wmchikwanha/same-basis-edu-au.git
cd same-basis-edu-au
npm i
npm run dev
```

## Author

Walter M. Chikwanha · ORCID [0000-0002-1822-2168](https://orcid.org/0000-0002-1822-2168) · [walter-m-chikwanha.site](http://www.walter-m-chikwanha.site/)
