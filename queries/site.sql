SELECT DISTINCT entity.sigle, entity.entloc, entity.localveg, entity.sampdate, entity.depthatloc, entity.sampdevice, entity.corediamcm, entity.notes, descr.description, sitedesc.sitedescript, sitedesc.physiography, sitedesc.surroundveg, siteloc.sitename, siteloc.latdd, siteloc.londd, siteloc.elevation
  FROM entity, descr, sitedesc, siteloc
  WHERE
    entity.sigle    = $1 AND
    entity.site_     = siteloc.site_ AND
    entity.site_     = sitedesc.site_ AND
    entity.descriptor = descr.descriptor
