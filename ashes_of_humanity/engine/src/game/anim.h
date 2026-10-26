// ============================================================================
//  ASHES OF HUMANITY: LAST SIGNAL
//  Animation sampling.
// ============================================================================
#pragma once
#include "assets/assets.h"
#include "gfx/gfx_types.h"
#include <map>
#include <string>
#include <vector>

namespace aoh {

struct AnimLibrary {
  // species name -> clips
  std::map<std::string, std::vector<AnimClip>> clips;
  std::map<std::string, int> clipIndexByName;
  bool loadFromFile(const std::string& path, const std::string& species);
  int  clipIndex(const std::string& species, const std::string& clip) const;
};

// Samples a clip and produces skinning matrices for the bones of a mesh.
class Animator {
public:
  void setLibrary(const AnimLibrary* lib) { m_lib = lib; }
  void setSpecies(const std::string& s) { m_species = s; }

  // Builds skinning matrices for the given bone list.
  void sample(const std::vector<Bone>& bones, int clipIndex, f32 time,
              std::vector<Mat4>& out) const;

private:
  const AnimLibrary* m_lib = nullptr;
  std::string m_species;
};

} // namespace aoh
