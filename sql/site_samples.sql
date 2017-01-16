SELECT DISTINCT p_vars.varname, p_agedpt.agebp, p_counts.count, 100 * p_counts.count / sum(p_counts.count) OVER (PARTITION BY p_agedpt.agebp) AS percent
  FROM entity, p_vars, p_agedpt, p_counts, p_group
  WHERE
    entity.sigle     = $1 AND
    p_group.groupid  = ANY($2::text[]) AND
    entity.e_        = p_counts.e_ AND
    entity.e_        = p_agedpt.e_ AND
    p_vars.var_      = p_group.var_ AND
    p_vars.var_      = p_counts.var_ AND
    p_counts.sample_ = p_agedpt.sample_
  ORDER BY p_agedpt.agebp
