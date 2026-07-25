
WITH g AS (SELECT id, name FROM public.groups),
seed(group_name, name, short_name, code) AS (VALUES
  ('A','Qatar','QAT','qa'),('A','Ecuador','ECU','ec'),('A','Senegal','SEN','sn'),('A','Netherlands','NED','nl'),
  ('B','England','ENG','gb-eng'),('B','Iran','IRN','ir'),('B','United States','USA','us'),('B','Wales','WAL','gb-wls'),
  ('C','Argentina','ARG','ar'),('C','Saudi Arabia','KSA','sa'),('C','Mexico','MEX','mx'),('C','Poland','POL','pl'),
  ('D','France','FRA','fr'),('D','Australia','AUS','au'),('D','Denmark','DEN','dk'),('D','Tunisia','TUN','tn'),
  ('E','Spain','ESP','es'),('E','Costa Rica','CRC','cr'),('E','Germany','GER','de'),('E','Japan','JPN','jp'),
  ('F','Belgium','BEL','be'),('F','Canada','CAN','ca'),('F','Morocco','MAR','ma'),('F','Croatia','CRO','hr'),
  ('G','Brazil','BRA','br'),('G','Serbia','SRB','rs'),('G','Switzerland','SUI','ch'),('G','Cameroon','CMR','cm'),
  ('H','Portugal','POR','pt'),('H','Ghana','GHA','gh'),('H','Uruguay','URU','uy'),('H','South Korea','KOR','kr'),
  ('I','Italy','ITA','it'),('I','Nigeria','NGA','ng'),('I','Colombia','COL','co'),('I','Chile','CHI','cl'),
  ('J','Sweden','SWE','se'),('J','Norway','NOR','no'),('J','Austria','AUT','at'),('J','Turkey','TUR','tr'),
  ('K','Egypt','EGY','eg'),('K','Algeria','ALG','dz'),('K','Ivory Coast','CIV','ci'),('K','South Africa','RSA','za'),
  ('L','Peru','PER','pe'),('L','Paraguay','PAR','py'),('L','Venezuela','VEN','ve'),('L','Bolivia','BOL','bo')
)
INSERT INTO public.teams (name, short_name, logo_url, group_id)
SELECT s.name, s.short_name, 'https://flagcdn.com/w160/' || s.code || '.png', g.id
FROM seed s JOIN g ON g.name = s.group_name
WHERE NOT EXISTS (SELECT 1 FROM public.teams t WHERE lower(t.name) = lower(s.name));
