SELECT DISTINCT
    entity.sigle,
    max(p_agedpt.agebp) AS agebp_max,
    min(p_agedpt.agebp) AS agebp_min
  FROM entity, p_agedpt
  WHERE
    entity.sigle = $1 AND
    entity.e_    = p_agedpt.e_
  GROUP BY entity.sigle
